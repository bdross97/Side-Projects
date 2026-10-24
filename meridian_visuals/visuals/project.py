"""Project model. A project is a plain JSON-able dict so saving, undo and
handing it to the export process are all just copies of the same data."""
from __future__ import annotations

import copy
import json
import re
import uuid
from pathlib import Path

from . import EXPORT_DIR
from .schema import (ASPECTS, EFFECT_ORDER, EFFECTS, FOOTAGE, FORMATS, FRAMING,
                     LAYER_COMMON, LAYER_TYPES, OVERLAY, PACKS, generators)
from .timing import BAR_CHOICES, BPM_DEFAULT, BPM_MAX, BPM_MIN, LoopTiming

VERSION = 1
DEFAULT_LOGO = Path.home() / "Desktop/Meridian Assets/asset pack/meridian_white_transparent.svg"


def _effects(values: dict | None) -> dict:
    values = values or {}
    return {k: EFFECTS[k].fill(values.get(k)) for k in EFFECT_ORDER}


def new_layer(kind: str, **params) -> dict:
    layer = {"id": uuid.uuid4().hex[:8], "type": kind, "name": LAYER_TYPES[kind],
             "visible": True, "params": params}
    return normalize_layer(layer)


def normalize_layer(layer: dict) -> dict:
    layer = copy.deepcopy(layer)
    kind = layer["type"]
    layer.setdefault("id", uuid.uuid4().hex[:8])
    layer.setdefault("name", LAYER_TYPES.get(kind, kind))
    layer["visible"] = bool(layer.get("visible", True))
    layer["layer"] = LAYER_COMMON.fill(layer.get("layer"))
    layer["effects"] = _effects(layer.get("effects"))
    if kind == "footage":
        layer["params"] = FOOTAGE.fill(layer.get("params"))
        framing = layer.get("framing") or {}
        layer["framing"] = {a: FRAMING.fill(framing.get(a)) for a in ASPECTS}
    elif kind == "overlay":
        layer["params"] = OVERLAY.fill(layer.get("params"))
    elif kind == "generator":
        gens = generators()
        params = layer.get("params") or {}
        shader = params.get("shader") if params.get("shader") in gens else next(iter(gens))
        saved = params.get("shader_params") or {}
        # Keep settings for every shader the user has touched, so switching
        # generators back and forth doesn't lose tweaks.
        shader_params = {k: gens[k].section.fill(v) for k, v in saved.items() if k in gens}
        shader_params[shader] = gens[shader].section.fill(saved.get(shader))
        layer["params"] = {"shader": shader, "transparent": bool(params.get("transparent", False)),
                           "shader_params": shader_params}
    return layer


def new_project() -> dict:
    gen = new_layer("generator", shader="flow")
    gen["name"] = "Flow field"
    layers = [gen]
    if DEFAULT_LOGO.exists():
        logo = new_layer("overlay", source=str(DEFAULT_LOGO), size=0.55)
        logo["name"] = "meridian logo"
        layers.append(logo)
    return normalize({"name": "untitled", "layers": layers})


def normalize(project: dict) -> dict:
    p = copy.deepcopy(project)
    out = {
        "version": VERSION,
        "name": str(p.get("name") or "untitled"),
        "pack": p.get("pack") if p.get("pack") in dict(PACKS) else "meridian",
        "bpm": float(min(BPM_MAX, max(BPM_MIN, float(p.get("bpm", BPM_DEFAULT))))),
        "bars": int(p.get("bars")) if p.get("bars") in BAR_CHOICES else 8,
        "preview_format": p.get("preview_format") if p.get("preview_format") in FORMATS else "1080p",
        "layers": [normalize_layer(l) for l in p.get("layers", []) if l.get("type") in LAYER_TYPES],
        "global_effects": _effects(p.get("global_effects")),
        "export": {
            "formats": [f for f in (p.get("export") or {}).get("formats", ["1080p", "reels"])
                        if f in FORMATS],
            "folder": (p.get("export") or {}).get("folder") or str(EXPORT_DIR),
        },
    }
    return out


def timing(project: dict) -> LoopTiming:
    return LoopTiming(project["bpm"], project["bars"])


def save(project: dict, path: str | Path) -> None:
    Path(path).write_text(json.dumps(project, indent=2))


def load(path: str | Path) -> dict:
    return normalize(json.loads(Path(path).read_text()))


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "untitled"


def export_filename(project: dict, fmt_key: str, ext: str = "mp4") -> str:
    fmt = FORMATS[fmt_key]
    bpm = f"{project['bpm']:g}".replace(".", "p")
    return (f"{project['pack']}_{slug(project['name'])}_{bpm}bpm_"
            f"{project['bars']}bars_{fmt.width}x{fmt.height}.{ext}")
