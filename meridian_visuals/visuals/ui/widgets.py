"""Control widgets generated from Param specs."""
from __future__ import annotations

import math
from pathlib import Path
from typing import Callable

from PySide6.QtCore import QObject, Qt, Signal
from PySide6.QtGui import QColor
from PySide6.QtWidgets import (QCheckBox, QColorDialog, QComboBox, QDoubleSpinBox, QFileDialog,
                               QFormLayout, QGroupBox, QHBoxLayout, QLabel, QLineEdit,
                               QPushButton, QSlider, QSpinBox, QToolButton, QVBoxLayout, QWidget)

from ..params import Param, Section

SLIDER_STEPS = 1000


class FloatControl(QWidget):
    changed = Signal(object)

    def __init__(self, p: Param, value):
        super().__init__()
        self.p = p
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        self.slider = QSlider(Qt.Horizontal)
        self.slider.setRange(0, SLIDER_STEPS if p.kind == "float" else int(p.max - p.min))
        self.spin = QDoubleSpinBox() if p.kind == "float" else QSpinBox()
        self.spin.setRange(p.min, p.max) if p.kind == "float" else self.spin.setRange(int(p.min), int(p.max))
        if p.kind == "float":
            self.spin.setDecimals(max(0, min(3, -math.floor(math.log10(p.step)))) if p.step < 1 else 0)
            self.spin.setSingleStep(p.step)
        self.spin.setFixedWidth(72)
        self.spin.setKeyboardTracking(False)
        lay.addWidget(self.slider, 1)
        lay.addWidget(self.spin)
        self.set_value(value)
        self.slider.valueChanged.connect(self._from_slider)
        self.spin.valueChanged.connect(self._from_spin)

    def _to_slider(self, v) -> int:
        if self.p.kind == "int":
            return int(v - self.p.min)
        return round((v - self.p.min) / (self.p.max - self.p.min) * SLIDER_STEPS)

    def set_value(self, v):
        for w in (self.slider, self.spin):
            w.blockSignals(True)
        self.slider.setValue(self._to_slider(v))
        self.spin.setValue(v)
        for w in (self.slider, self.spin):
            w.blockSignals(False)

    def _from_slider(self, i):
        v = int(self.p.min) + i if self.p.kind == "int" else \
            self.p.min + (self.p.max - self.p.min) * i / SLIDER_STEPS
        self.spin.blockSignals(True)
        self.spin.setValue(v)
        self.spin.blockSignals(False)
        self.changed.emit(self.p.clamp(v))

    def _from_spin(self, v):
        self.slider.blockSignals(True)
        self.slider.setValue(self._to_slider(v))
        self.slider.blockSignals(False)
        self.changed.emit(self.p.clamp(v))


class ColorControl(QPushButton):
    changed = Signal(object)

    def __init__(self, p: Param, value):
        super().__init__()
        self.p = p
        self.setFixedHeight(24)
        self.set_value(value)
        self.clicked.connect(self._pick)

    def set_value(self, v):
        self.value = v
        light = QColor(v).lightnessF() > 0.6
        self.setText(v)
        self.setStyleSheet(f"background:{v}; color:{'#000' if light else '#fff'}; border-radius:4px;")

    def _pick(self):
        c = QColorDialog.getColor(QColor(self.value), self, self.p.label)
        if c.isValid():
            self.set_value(c.name())
            self.changed.emit(c.name())


class FileControl(QWidget):
    changed = Signal(object)

    def __init__(self, p: Param, value, start_dir: Callable[[], str]):
        super().__init__()
        self.p = p
        self.start_dir = start_dir
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        self.edit = QLineEdit()
        self.edit.setReadOnly(True)
        self.edit.setPlaceholderText("No file chosen")
        btn = QPushButton("Choose…")
        btn.clicked.connect(self._pick)
        lay.addWidget(self.edit, 1)
        lay.addWidget(btn)
        self.set_value(value)

    def set_value(self, v):
        self.edit.setText(Path(v).name if v else "")
        self.edit.setToolTip(v)

    def _pick(self):
        path, _ = QFileDialog.getOpenFileName(self, self.p.label, self.start_dir(), self.p.file_filter)
        if path:
            self.set_value(path)
            self.changed.emit(path)


def make_control(p: Param, value, start_dir: Callable[[], str]) -> QWidget:
    if p.kind in ("float", "int"):
        return FloatControl(p, value)
    if p.kind == "color":
        return ColorControl(p, value)
    if p.kind == "file":
        return FileControl(p, value, start_dir)
    if p.kind == "bool":
        w = QCheckBox()
        w.setChecked(bool(value))
        w.changed = w.toggled
        return w
    if p.kind == "choice":
        w = QComboBox()
        for val, label in p.options:
            w.addItem(label, val)
        w.setCurrentIndex(max(0, w.findData(value)))
        w.changed = _ComboRelay(w).changed
        return w
    w = QLineEdit(str(value))
    w.changed = _LineRelay(w).changed
    return w


class _ComboRelay(QObject):
    changed = Signal(object)

    def __init__(self, combo: QComboBox):
        super().__init__(combo)
        combo.currentIndexChanged.connect(lambda _i: self.changed.emit(combo.currentData()))


class _LineRelay(QObject):
    changed = Signal(object)

    def __init__(self, edit: QLineEdit):
        super().__init__(edit)
        edit.editingFinished.connect(lambda: self.changed.emit(edit.text()))


class SectionBox(QGroupBox):
    """One titled panel section: optional Enabled toggle, Randomize, Reset,
    then one row per param. `get` returns the live dict it edits; `on_change`
    is called as on_change(key, value) for every edit."""

    def __init__(self, section: Section, get: Callable[[], dict],
                 on_change: Callable[[str, object], None],
                 on_replace: Callable[[dict], None],
                 title: str | None = None, hidden: set[str] = frozenset(),
                 start_dir: Callable[[], str] = lambda: str(Path.home()),
                 note: str = ""):
        super().__init__(title or section.title)
        self.section = section
        values = get()
        outer = QVBoxLayout(self)
        outer.setContentsMargins(8, 6, 8, 8)
        head = QHBoxLayout()
        if section.toggle:
            en = QCheckBox("Enabled")
            en.setChecked(values.get("enabled", False))
            en.toggled.connect(lambda v: on_change("enabled", v))
            head.addWidget(en)
        head.addStretch(1)
        if any(p.randomize for p in section.params):
            rnd = QToolButton()
            rnd.setText("Randomize")
            rnd.setToolTip("New random values for this section (Cmd+Z to undo)")
            rnd.clicked.connect(lambda: on_replace(section.randomized(get())))
            head.addWidget(rnd)
        reset = QToolButton()
        reset.setText("Reset")
        reset.setToolTip("Back to defaults for this section")

        def do_reset():
            fresh = section.defaults()
            if section.toggle:
                fresh["enabled"] = get().get("enabled", False)
            for p in section.params:
                if not p.randomize and p.kind in ("file", "text"):
                    fresh[p.key] = get()[p.key]   # keep chosen files / typed text
            on_replace(fresh)
        reset.clicked.connect(do_reset)
        head.addWidget(reset)
        outer.addLayout(head)
        if note:
            lbl = QLabel(note)
            lbl.setWordWrap(True)
            lbl.setObjectName("note")
            outer.addWidget(lbl)
        form = QFormLayout()
        form.setLabelAlignment(Qt.AlignRight)
        form.setRowWrapPolicy(QFormLayout.DontWrapRows)
        self.controls = {}
        for p in section.params:
            if p.key in hidden:
                continue
            w = make_control(p, values[p.key], start_dir)
            w.changed.connect(lambda v, k=p.key: on_change(k, v))
            label = QLabel(p.label)
            if p.help:
                label.setToolTip(p.help)
                w.setToolTip(p.help)
            form.addRow(label, w)
            self.controls[p.key] = w
        outer.addLayout(form)
