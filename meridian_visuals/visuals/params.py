"""Parameter specs: one declaration drives the panel widgets, defaults,
randomize, and JSON save/load."""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Param:
    key: str
    label: str
    kind: str  # float | int | bool | color | choice | file | text
    default: Any
    min: float = 0.0
    max: float = 1.0
    step: float = 0.01
    options: tuple = ()          # for choice: (value, label) pairs
    file_filter: str = ""        # for file
    randomize: bool = True       # included in the section's Randomize button
    help: str = ""

    def clamp(self, value):
        if self.kind == "float":
            return float(min(self.max, max(self.min, float(value))))
        if self.kind == "int":
            return int(min(self.max, max(self.min, int(round(float(value))))))
        if self.kind == "bool":
            return bool(value)
        if self.kind == "choice":
            values = [o[0] for o in self.options]
            return value if value in values else self.default
        return value

    def random_value(self, rng: random.Random):
        if self.kind == "float":
            return round(rng.uniform(self.min, self.max), 4)
        if self.kind == "int":
            return rng.randint(int(self.min), int(self.max))
        if self.kind == "bool":
            return rng.random() < 0.5
        if self.kind == "color":
            return "#%02x%02x%02x" % tuple(rng.randint(0, 255) for _ in range(3))
        if self.kind == "choice":
            return rng.choice(self.options)[0]
        return self.default


@dataclass
class Section:
    """A titled group of params (one panel box with its own Randomize)."""
    key: str
    title: str
    params: list[Param] = field(default_factory=list)
    toggle: bool = False   # has an Enabled checkbox stored under "enabled"

    def defaults(self) -> dict:
        d = {p.key: p.default for p in self.params}
        if self.toggle:
            d["enabled"] = False
        return d

    def fill(self, values: dict | None) -> dict:
        """Defaults overlaid with saved values (clamped). Unknown keys dropped."""
        out = self.defaults()
        for p in self.params:
            if values and p.key in values:
                out[p.key] = p.clamp(values[p.key])
        if self.toggle and values and "enabled" in values:
            out["enabled"] = bool(values["enabled"])
        return out

    def randomized(self, values: dict, rng: random.Random | None = None) -> dict:
        rng = rng or random.Random()
        out = dict(values)
        for p in self.params:
            if p.randomize:
                out[p.key] = p.random_value(rng)
        return out


def hex_to_rgb(value: str) -> tuple[float, float, float]:
    v = value.lstrip("#")
    if len(v) != 6:
        return (1.0, 1.0, 1.0)
    return tuple(int(v[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
