"""Footage frame suppliers for the renderer.

PreviewFeeds reads small proxies (made in the background on first use).
ExportFeeds reads full-quality intermediates of just the span each layer
needs, made right before export and deleted afterwards.
"""
from __future__ import annotations

import math
import threading
from pathlib import Path

from . import CACHE_DIR
from . import media
from .timing import LoopTiming


class Feeds:
    def _reader(self, layer: dict, info: media.ClipInfo, timing: LoopTiming):
        raise NotImplementedError

    def frames(self, layer: dict, frame: float, timing: LoopTiming):
        """[(cache_key, rgb_array, weight), ...] or None if not available yet."""
        src = layer["params"]["source"]
        if not src or not Path(src).exists():
            return None
        info = media.probe(src)
        got = self._reader(layer, info, timing)
        if got is None:
            return None
        reader, offset = got
        out = []
        for t, w in media.source_times(layer["params"], info, timing, frame):
            idx = media.frame_index(t - offset, info.fps)
            out.append(((str(reader.path), idx), reader.get(idx), w))
        return out


class PreviewFeeds(Feeds):
    def __init__(self):
        self._readers: dict[str, media.IntraReader] = {}
        self.status: dict[str, str] = {}   # source path -> "pending" | "ready" | error text
        self.version = 0                   # bumps when a proxy finishes, so the UI redraws
        self._lock = threading.Lock()

    def _build(self, src: str):
        try:
            media.ensure_proxy(src)
            result = "ready"
        except Exception as e:  # shown in the panel
            result = f"Could not read this clip: {e}"
        with self._lock:
            self.status[src] = result
            self.version += 1

    def request(self, src: str):
        with self._lock:
            if src in self.status:
                return
            if media.proxy_path(src).exists():
                self.status[src] = "ready"
                return
            self.status[src] = "pending"
        threading.Thread(target=self._build, args=(src,), daemon=True).start()

    def _reader(self, layer, info, timing):
        src = layer["params"]["source"]
        self.request(src)
        if self.status.get(src) != "ready":
            return None
        if src not in self._readers:
            self._readers[src] = media.IntraReader(media.proxy_path(src), info.fps)
        return self._readers[src], 0.0


class ExportFeeds(Feeds):
    def __init__(self, out_size: tuple[int, int], aspect: str, log=print):
        self.out_size = out_size
        self.aspect = aspect
        self.log = log
        self._readers: dict[tuple, tuple] = {}
        self._files: list[Path] = []

    def _reader(self, layer, info, timing):
        p = layer["params"]
        pl = media.plan(p, info, timing)
        span = min(pl.span, pl.available) + 2.0 / info.fps
        # Only decode as many pixels as the output can show at this zoom.
        W, H = self.out_size
        cover = max(W / info.width, H / info.height)
        zoom = layer["framing"][self.aspect]["zoom"]
        long_side = min(max(info.width, info.height),
                        math.ceil(max(info.width, info.height) * cover * zoom / 2) * 2)
        key = (info.path, round(p["trim_in"], 4), round(span, 4), long_side)
        if key not in self._readers:
            dst = CACHE_DIR / "export" / media._cache_name(info.path, *key[1:])
            if not dst.exists():
                self.log(f"Preparing {Path(info.path).name} ({span:.1f}s at {long_side}px)")
                media.transcode_intra(info.path, dst, long_side, crf=12,
                                      start=p["trim_in"], duration=span)
            self._files.append(dst)
            self._readers[key] = (media.IntraReader(dst, info.fps), p["trim_in"])
        return self._readers[key]

    def close(self):
        for reader, _ in self._readers.values():
            reader.close()
        for f in self._files:
            f.unlink(missing_ok=True)
