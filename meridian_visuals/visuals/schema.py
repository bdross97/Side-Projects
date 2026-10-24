"""What exists: output formats, effects, layer types, generator shaders.

Nothing here touches OpenGL, so the UI, the project model and the exporter
can all share it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache

from . import SHADER_DIR
from .params import Param, Section


# ---------------------------------------------------------------- formats ---

@dataclass(frozen=True)
class Format:
    key: str
    label: str
    width: int
    height: int
    aspect: str   # framing is stored per aspect, so 1080p and 4K share it

    @property
    def size(self) -> tuple[int, int]:
        return (self.width, self.height)


FORMATS = {f.key: f for f in [
    Format("1080p", "16:9  1920x1080  (LED / YouTube)", 1920, 1080, "16:9"),
    Format("4k", "16:9  3840x2160  (LED / VFX)", 3840, 2160, "16:9"),
    Format("reels", "9:16  1080x1920  (Reels / Stories)", 1080, 1920, "9:16"),
    Format("portrait", "4:5  1080x1350  (Feed)", 1080, 1350, "4:5"),
    Format("square", "1:1  1080x1080  (Feed)", 1080, 1080, "1:1"),
]}
ASPECTS = ("16:9", "9:16", "4:5", "1:1")

PACKS = (("meridian", "meridian"), ("techoma", "The TECHOMA"))


# ---------------------------------------------------------------- effects ---
# Spatial sizes are a percentage of frame height so the low-res preview
# matches the full-res export.

EFFECTS: dict[str, Section] = {s.key: s for s in [
    Section("color", "Color", toggle=True, params=[
        Param("exposure", "Exposure (stops)", "float", 0.0, -3, 3, 0.05),
        Param("contrast", "Contrast", "float", 1.0, 0.2, 2.5, 0.01),
        Param("saturation", "Saturation", "float", 1.0, 0, 2.5, 0.01),
        Param("temperature", "Warm / cool", "float", 0.0, -1, 1, 0.01,
              help="Positive warms (amber), negative cools (blue)."),
        Param("tint", "Green / magenta", "float", 0.0, -1, 1, 0.01),
        Param("hue", "Hue shift (deg)", "float", 0.0, -180, 180, 1),
    ]),
    Section("invert", "Invert", toggle=True, params=[
        Param("amount", "Amount", "float", 1.0, 0, 1, 0.01,
              help="1 = full negative. In-between values give a washed, inverted mix."),
    ]),
    Section("blur", "Blur", toggle=True, params=[
        Param("radius", "Radius (% of height)", "float", 1.0, 0, 10, 0.05),
    ]),
    Section("glow", "Glow / bloom", toggle=True, params=[
        Param("threshold", "Threshold", "float", 0.6, 0, 1, 0.01,
              help="Only pixels brighter than this glow."),
        Param("radius", "Spread (% of height)", "float", 4.0, 0.2, 20, 0.1),
        Param("intensity", "Intensity", "float", 1.0, 0, 4, 0.01),
        Param("tint", "Glow color", "color", "#ffffff"),
    ]),
]}
EFFECT_ORDER = ("color", "invert", "blur", "glow")


# ----------------------------------------------------------------- layers ---

LAYER_COMMON = Section("layer", "Layer", params=[
    Param("opacity", "Opacity", "float", 1.0, 0, 1, 0.01),
])

FOOTAGE = Section("footage", "Footage", params=[
    Param("source", "Video file", "file", "", randomize=False,
          file_filter="Video (*.mov *.mp4 *.m4v *.mts *.avi *.mkv)"),
    Param("trim_in", "Start at (s)", "float", 0.0, 0, 600, 0.01, randomize=False),
    Param("speed", "Speed", "float", 1.0, 0.05, 4, 0.01,
          help="0.25 on a 120 fps clip = true slow motion (every source frame used)."),
    Param("reverse", "Reverse", "bool", False),
    Param("loop_mode", "Loop seam", "choice", "crossfade",
          options=(("crossfade", "Crossfade"), ("pingpong", "Ping-pong"), ("cut", "Hard cut")),
          help="How the end of the loop joins the start. Crossfade and ping-pong are seamless."),
    Param("crossfade_beats", "Crossfade length (beats)", "float", 2.0, 0.25, 16, 0.25),
])

FRAMING = Section("framing", "Framing (this aspect)", params=[
    Param("zoom", "Zoom", "float", 1.0, 1, 4, 0.01),
    Param("pan_x", "Pan left / right", "float", 0.0, -1, 1, 0.01),
    Param("pan_y", "Pan up / down", "float", 0.0, -1, 1, 0.01),
])

FONT_CHOICES = (("Paladins", "Paladins"), ("Helvetica Neue", "Helvetica Neue"),
                ("Avenir Next", "Avenir Next"), ("Futura", "Futura"),
                ("Menlo", "Menlo"))

OVERLAY = Section("overlay", "Logo / text", params=[
    Param("mode", "Content", "choice", "image", randomize=False,
          options=(("image", "Logo image"), ("text", "Text"))),
    Param("source", "Logo file", "file", "", randomize=False,
          file_filter="Images (*.png *.svg *.jpg *.jpeg)"),
    Param("text", "Text", "text", "meridian", randomize=False),
    Param("font", "Font", "choice", "Paladins", options=FONT_CHOICES, randomize=False),
    Param("color", "Text color", "color", "#ffffff", randomize=False),
    Param("size", "Size", "float", 0.5, 0.02, 1.5, 0.01,
          help="Width as a fraction of the frame's shorter side, so it reads the same in every aspect."),
    Param("x", "Position X", "float", 0.0, -1, 1, 0.01),
    Param("y", "Position Y", "float", 0.0, -1, 1, 0.01),
    Param("rotation", "Rotation (deg)", "float", 0.0, -180, 180, 1, randomize=False),
    Param("animation", "Animation", "choice", "none",
          options=(("none", "None"), ("pulse", "Pulse on beat"), ("breathe", "Breathe per bar"),
                   ("drift", "Slow drift"), ("flicker", "Flicker on beat"))),
    Param("anim_amount", "Animation amount", "float", 0.3, 0, 1, 0.01),
])

LAYER_TYPES = {"footage": "Footage", "generator": "Generator", "overlay": "Logo / text"}


# ------------------------------------------------------------- generators ---
# Each generator is a .frag file in shaders/generators with a header like:
#   // @name Flow field
#   // @pack meridian
#   // @param cycles int 1 1 6 "Motion cycles per loop"
#   // @param color_a color #0b3d2e "Deep color"
# A param `foo` becomes the uniform `p_foo`.

_PARAM_RE = re.compile(r'//\s*@param\s+(\w+)\s+(\w+)\s+(\S+)(?:\s+(\S+)\s+(\S+))?\s+"([^"]*)"')


@dataclass(frozen=True)
class Generator:
    key: str
    name: str
    pack: str
    section: Section
    source: str


@lru_cache(maxsize=None)
def generators() -> dict[str, Generator]:
    out = {}
    for path in sorted((SHADER_DIR / "generators").glob("*.frag")):
        src = path.read_text()
        name = re.search(r"//\s*@name\s+(.+)", src)
        pack = re.search(r"//\s*@pack\s+(\w+)", src)
        params = []
        for key, kind, default, lo, hi, label in _PARAM_RE.findall(src):
            if kind == "color":
                params.append(Param(key, label, "color", default))
            elif kind == "int":
                params.append(Param(key, label, "int", int(default), int(lo), int(hi), 1))
            else:
                lo_f, hi_f = float(lo), float(hi)
                params.append(Param(key, label, "float", float(default), lo_f, hi_f,
                                    (hi_f - lo_f) / 200))
        gname = name.group(1).strip() if name else path.stem
        out[path.stem] = Generator(path.stem, gname, pack.group(1) if pack else "",
                                   Section("shader", gname, params), src)
    return out


def generator_section() -> Section:
    gens = generators()
    opts = tuple((k, f"{g.name}  [{g.pack}]" if g.pack else g.name) for k, g in gens.items())
    return Section("generator", "Generator", params=[
        Param("shader", "Pattern", "choice", next(iter(gens), ""), options=opts, randomize=False),
        Param("transparent", "Black is see-through", "bool", False, randomize=False,
              help="Lets layers underneath show through the dark parts (good for white lines over footage)."),
    ])
