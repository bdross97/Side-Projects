"""Render a project to video files.

Runs in its own process (the app launches it), so the UI stays responsive
and a crash here can't take your unsaved work with it. Also usable directly:

    python -m visuals.export projects/my_loop.json --formats 1080p reels
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

from . import FPS
from . import project as proj
from .feeds import ExportFeeds
from .schema import FORMATS


def _encoder(path: Path, size: tuple[int, int]) -> subprocess.Popen:
    w, h = size
    return subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
        # Convert RGB -> video color with the HD (BT.709) formula and tag it,
        # so colors match across Instagram, QuickTime and VJ software.
        "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,"
               "format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
        "-g", str(FPS), "-colorspace", "bt709", "-color_primaries", "bt709",
        "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart",
        str(path),
    ], stdin=subprocess.PIPE)


def export(project: dict, fmt_keys: list[str], folder: Path, log=print) -> list[Path]:
    from .render.engine import Engine  # GL context only when actually rendering

    project = proj.normalize(project)
    timing = proj.timing(project)
    folder.mkdir(parents=True, exist_ok=True)
    engine = Engine()
    log(f"GPU: {engine.renderer}")
    log(timing.describe())
    done = []
    for n, key in enumerate(fmt_keys, 1):
        fmt = FORMATS[key]
        out = folder / proj.export_filename(project, key)
        tmp = out.with_name(out.stem + ".rendering.mp4")
        feeds = ExportFeeds(fmt.size, fmt.aspect, log)
        enc = None
        try:
            # Prepare footage first so the progress bar reflects rendering only.
            for layer in project["layers"]:
                if layer["type"] == "footage" and layer["visible"]:
                    feeds.frames(layer, 0, timing)
            enc = _encoder(tmp, fmt.size)
            t0 = time.time()
            for i in range(timing.frames):
                final = engine.render(project, i, fmt.size, fmt.aspect, feeds, timing)
                enc.stdin.write(engine.read_rgb(final))
                if i % 5 == 0 or i == timing.frames - 1:
                    log(f"PROGRESS {n} {len(fmt_keys)} {i + 1} {timing.frames} {fmt.label.split('(')[0].strip()}")
            enc.stdin.close()
            if enc.wait() != 0:
                raise RuntimeError("ffmpeg failed while encoding")
            tmp.replace(out)
            log(f"DONE {out}  ({time.time() - t0:.0f}s)")
            done.append(out)
        finally:
            if enc and enc.poll() is None:
                enc.kill()
            tmp.unlink(missing_ok=True)
            feeds.close()
    for layer_id, msg in engine.errors.items():
        log(f"WARNING layer {layer_id}: {msg}")
    return done


def main(argv=None):
    ap = argparse.ArgumentParser(description="Export a visuals project to video.")
    ap.add_argument("project", help="project .json file")
    ap.add_argument("--formats", nargs="+", default=None, choices=list(FORMATS),
                    help="output formats (default: the project's export settings)")
    ap.add_argument("--out", default=None, help="output folder")
    args = ap.parse_args(argv)

    # Text and SVG logos are drawn with Qt, which needs an app object; the
    # offscreen platform means no window appears.
    # Cancel from the app sends SIGTERM; exit through `finally` blocks so
    # half-written files are removed.
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(1))
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    from PySide6.QtGui import QGuiApplication
    _app = QGuiApplication.instance() or QGuiApplication(sys.argv[:1])

    project = proj.load(args.project)
    fmts = args.formats or project["export"]["formats"]
    folder = Path(args.out or project["export"]["folder"]).expanduser()

    def log(msg):
        print(msg, flush=True)

    try:
        export(project, fmts, folder, log)
    except Exception as e:
        log(f"ERROR {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
