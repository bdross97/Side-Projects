"""Video probing, proxy files and frame access.

Phone/camera footage is long-GOP (only occasional full "key" frames, the
rest stored as differences), which makes jumping around - reverse,
crossfades, slow motion - slow. So every clip is first copied with ffmpeg
into an all-intra file (every frame is a keyframe):
  - a small preview proxy (960px) made once on import, for the preview
  - a full-quality intermediate of just the needed span, made at export
"""
from __future__ import annotations

import hashlib
import json
import math
import subprocess
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path

import av
import numpy as np
from av.video.reformatter import Colorspace

from . import CACHE_DIR, FPS
from .timing import LoopTiming

PROXY_LONG_SIDE = 960
HDR_TRANSFERS = {"arib-std-b67", "smpte2084"}


@dataclass(frozen=True)
class ClipInfo:
    path: str
    width: int       # display size (after phone rotation)
    height: int
    fps: float
    duration: float
    hdr: bool

    @property
    def frames(self) -> int:
        return max(1, int(self.duration * self.fps))


_probe_cache: dict[tuple, ClipInfo] = {}


def probe(path: str) -> ClipInfo:
    p = Path(path)
    key = (str(p), p.stat().st_mtime)
    if key in _probe_cache:
        return _probe_cache[key]
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_streams",
         "-show_format", "-of", "json", str(p)],
        capture_output=True, text=True, check=True, timeout=60)
    data = json.loads(out.stdout)
    s = data["streams"][0]
    num, den = (s.get("avg_frame_rate") or s.get("r_frame_rate") or "30/1").split("/")
    fps = float(num) / float(den) if float(den) else 30.0
    w, h = int(s["width"]), int(s["height"])
    rotation = 0
    for sd in s.get("side_data_list", []):
        if "rotation" in sd:
            rotation = int(sd["rotation"])
    if abs(rotation) % 180 == 90:
        w, h = h, w
    duration = float(s.get("duration") or data["format"].get("duration") or 0)
    info = ClipInfo(str(p), w, h, fps, duration, s.get("color_transfer") in HDR_TRANSFERS)
    _probe_cache[key] = info
    return info


def _cache_name(path: str, *parts) -> str:
    p = Path(path)
    h = hashlib.sha1(f"{p.resolve()}|{p.stat().st_mtime}|{parts}".encode()).hexdigest()[:16]
    return f"{p.stem[:40]}_{h}.mp4"


def transcode_intra(src: str, dst: Path, long_side: int, crf: int,
                    start: float = 0.0, duration: float | None = None) -> Path:
    """All-intra H.264 copy at the clip's own frame rate, tagged BT.709."""
    info = probe(src)
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".part.mp4")
    scale = (f"scale='if(gte(iw,ih),min({long_side},iw),-2)':'if(gte(iw,ih),-2,min({long_side},ih))'"
             ":flags=lanczos:out_color_matrix=bt709:out_range=tv")
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if start > 0:
        cmd += ["-ss", f"{start:.4f}"]
    cmd += ["-i", src]
    if duration is not None:
        cmd += ["-t", f"{duration:.4f}"]
    cmd += ["-an", "-vf", scale, "-fps_mode", "cfr", "-r", f"{info.fps:.6f}",
            "-c:v", "libx264", "-preset", "veryfast", "-tune", "fastdecode",
            "-g", "1", "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
            str(tmp)]
    subprocess.run(cmd, check=True, timeout=3600)
    tmp.replace(dst)
    return dst


def proxy_path(src: str) -> Path:
    return CACHE_DIR / "proxies" / _cache_name(src, PROXY_LONG_SIDE)


def ensure_proxy(src: str) -> Path:
    dst = proxy_path(src)
    if not dst.exists():
        transcode_intra(src, dst, PROXY_LONG_SIDE, crf=20)
    return dst


class IntraReader:
    """Random access to frames of an all-intra file, by frame index."""

    def __init__(self, path: Path, fps: float, cache_size: int = 12):
        self.path = path
        self.fps = fps
        self.container = av.open(str(path))
        self.stream = self.container.streams.video[0]
        self.stream.thread_type = "AUTO"
        self.frames = max(1, int((self.stream.frames or 0) or
                                 float(self.stream.duration * self.stream.time_base) * fps))
        self._iter = None
        self._pos = -10
        self._cache: OrderedDict[int, np.ndarray] = OrderedDict()
        self._cache_size = cache_size

    def _to_rgb(self, frame) -> np.ndarray:
        return frame.reformat(format="rgb24", src_colorspace=Colorspace.ITU709,
                              dst_colorspace=Colorspace.ITU709).to_ndarray()

    def _next(self):
        frame = next(self._iter)
        self._pos = round(frame.time * self.fps) if frame.time is not None else self._pos + 1
        return frame

    def get(self, index: int) -> np.ndarray:
        index = int(min(max(index, 0), self.frames - 1))
        if index in self._cache:
            self._cache.move_to_end(index)
            return self._cache[index]
        if self._iter is None or not (self._pos < index <= self._pos + 6):
            ts = int((index / self.fps) / self.stream.time_base)
            self.container.seek(ts, stream=self.stream, backward=True, any_frame=False)
            self._iter = self.container.decode(self.stream)
            self._pos = -10
        frame = None
        try:
            while True:
                frame = self._next()
                if self._pos >= index:
                    break
        except StopIteration:
            self._iter = None
            if frame is None:
                return self.get(index - 1) if index > 0 else np.zeros((16, 16, 3), np.uint8)
        rgb = self._to_rgb(frame)
        self._cache[index] = rgb
        if len(self._cache) > self._cache_size:
            self._cache.popitem(last=False)
        return rgb

    def close(self):
        self.container.close()


# ------------------------------------------------------------ loop mapping ---

@dataclass
class FootagePlan:
    """Which source seconds each output frame needs, relative to trim_in."""
    span: float          # seconds of source needed after trim_in
    available: float     # seconds of source available after trim_in
    warning: str = ""


def plan(params: dict, info: ClipInfo, timing: LoopTiming) -> FootagePlan:
    L, s = timing.seconds, params["speed"]
    available = max(0.0, info.duration - params["trim_in"])
    mode = params["loop_mode"]
    if mode == "pingpong":
        span = L / 2 * s
    elif mode == "crossfade":
        span = (L + _fade_seconds(params, timing)) * s
    else:
        span = L * s
    warning = ""
    if available <= 0:
        warning = "Start point is past the end of the clip."
    elif span > available + 1e-3:
        warning = (f"Needs {span:.1f}s of clip from the start point at this speed, "
                   f"only {available:.1f}s left. It will jump. Lower the speed, "
                   f"move the start earlier, or use fewer bars.")
    return FootagePlan(span, available, warning)


def _fade_seconds(params: dict, timing: LoopTiming) -> float:
    return min(params["crossfade_beats"] * timing.frames_per_beat / FPS, timing.seconds / 2)


def source_times(params: dict, info: ClipInfo, timing: LoopTiming,
                 frame: float) -> list[tuple[float, float]]:
    """[(source_seconds, weight), ...] for one output frame. Weights sum to 1;
    two entries means crossfading across the loop seam."""
    L, s = timing.seconds, params["speed"]
    t = (frame % timing.frames) / FPS
    pl = plan(params, info, timing)
    avail = max(pl.available, 1.0 / info.fps)
    mode = params["loop_mode"]

    def pos(rel: float) -> float:
        if params["reverse"]:
            rel = pl.span - rel
        rel = rel % avail if rel >= avail else max(rel, 0.0)
        return params["trim_in"] + rel

    if mode == "pingpong":
        half = L / 2
        x = t if t < half else L - t
        return [(pos(x * s), 1.0)]
    if mode == "crossfade":
        F = _fade_seconds(params, timing)
        if F > 0 and t < F:
            w = t / F
            w = w * w * (3 - 2 * w)  # smoothstep: eases in and out of the fade
            return [(pos((t + L) * s), 1.0 - w), (pos(t * s), w)]
    return [(pos(t * s), 1.0)]


def frame_index(seconds: float, fps: float) -> int:
    return int(math.floor(seconds * fps + 1e-4))
