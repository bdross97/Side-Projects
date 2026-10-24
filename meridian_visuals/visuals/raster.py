"""Turn logo files and text into RGBA pixels at an exact pixel width.

SVGs and text are re-rendered at the size they'll appear in the output, so a
logo stays sharp at 4K. Needs a QGuiApplication (the exporter makes an
offscreen one)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image
from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer


def _qimage_to_array(img: QImage) -> np.ndarray:
    img = img.convertToFormat(QImage.Format_RGBA8888_Premultiplied)
    w, h = img.width(), img.height()
    buf = np.frombuffer(img.constBits(), np.uint8, count=img.sizeInBytes())
    return buf.reshape(h, img.bytesPerLine())[:, : w * 4].reshape(h, w, 4).copy()


@lru_cache(maxsize=16)
def _pil_source(path: str, mtime: float) -> Image.Image:
    return Image.open(path).convert("RGBA")


@lru_cache(maxsize=32)
def _render(params_key: tuple, width_px: int) -> np.ndarray | None:
    params = dict(params_key)
    width_px = max(2, min(width_px, 8192))
    if params["mode"] == "text":
        return _render_text(params["text"], params["font"], params["color"], width_px)
    src = params["source"]
    if not src or not Path(src).exists():
        return None
    if src.lower().endswith(".svg"):
        r = QSvgRenderer(src)
        if not r.isValid():
            return None
        size = r.defaultSize()
        h = max(1, round(width_px * size.height() / max(1, size.width())))
        img = QImage(width_px, h, QImage.Format_RGBA8888_Premultiplied)
        img.fill(Qt.transparent)
        p = QPainter(img)
        p.setRenderHint(QPainter.Antialiasing)
        r.render(p)
        p.end()
        return _qimage_to_array(img)
    im = _pil_source(src, Path(src).stat().st_mtime)
    h = max(1, round(width_px * im.height / im.width))
    arr = np.asarray(im.resize((width_px, h), Image.LANCZOS), np.float32)
    arr[..., :3] *= arr[..., 3:4] / 255.0  # premultiply alpha
    return arr.round().astype(np.uint8)


def _render_text(text: str, family: str, color: str, width_px: int) -> np.ndarray | None:
    if not text.strip():
        return None
    font = QFont(family)
    font.setPixelSize(100)
    m = QFontMetricsF(font)
    w100 = max(1.0, m.horizontalAdvance(text))
    font.setPixelSize(max(4, round(100 * width_px / w100)))
    m = QFontMetricsF(font)
    w = max(2, int(m.horizontalAdvance(text)) + 4)
    h = max(2, int(m.height()) + 4)
    img = QImage(w, h, QImage.Format_RGBA8888_Premultiplied)
    img.fill(Qt.transparent)
    p = QPainter(img)
    p.setRenderHint(QPainter.TextAntialiasing)
    p.setFont(font)
    p.setPen(QColor(color))
    p.drawText(QRectF(0, 0, w, h), Qt.AlignCenter, text)
    p.end()
    return _qimage_to_array(img)


def overlay_pixels(params: dict, width_px: int) -> np.ndarray | None:
    keys = ("mode", "source", "text", "font", "color")
    # Quantize width so tiny size tweaks during a slider drag reuse renders.
    width_px = int(max(8, round(width_px / 8) * 8))
    return _render(tuple((k, params[k]) for k in keys), width_px)
