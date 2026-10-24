"""Main window: project settings + layers (left), preview (center),
inspector for the selected layer (right)."""
from __future__ import annotations

import copy
import time
import traceback
from pathlib import Path

from PySide6.QtCore import QEvent, QObject, Qt, QTimer
from PySide6.QtGui import QAction, QImage, QKeySequence, QPixmap
from PySide6.QtWidgets import (QAbstractSpinBox, QApplication, QComboBox, QDoubleSpinBox,
                               QFileDialog, QFormLayout, QHBoxLayout, QLabel, QLineEdit,
                               QListWidget, QListWidgetItem, QMainWindow, QMessageBox,
                               QPlainTextEdit, QPushButton, QScrollArea, QSizePolicy, QSlider,
                               QSplitter, QToolButton, QVBoxLayout, QWidget)

from .. import FPS, PROJECT_DIR, media
from .. import project as proj
from ..feeds import PreviewFeeds
from ..render.engine import Engine
from ..schema import (EFFECT_ORDER, EFFECTS, FOOTAGE, FORMATS, FRAMING, LAYER_COMMON, OVERLAY,
                      PACKS, generator_section, generators)
from ..timing import BAR_CHOICES, BPM_MAX, BPM_MIN
from .export_dialog import ExportDialog
from .widgets import SectionBox

GLOBAL = "__global__"
QUALITY = {"Low (480px, 15 fps)": (480, 15), "Medium (640px, 24 fps)": (640, 24),
           "High (960px, 30 fps)": (960, 30)}
MEDIA_DIR = Path.home() / "Desktop/Meridian Assets"
UNDO_LIMIT = 200


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.resize(1500, 900)
        self.engine = Engine()
        self.feeds = PreviewFeeds()
        self.project = proj.new_project()
        self.path: Path | None = None
        self.modified = False
        self.selected = self.project["layers"][-1]["id"] if self.project["layers"] else GLOBAL
        self.last_media_dir = str(MEDIA_DIR if MEDIA_DIR.exists() else Path.home())

        # Undo: snapshot the whole project before each edit. Rapid edits (a
        # slider drag) within 0.7s collapse into one undo step.
        self.undo_stack: list[dict] = []
        self.redo_stack: list[dict] = []
        self._burst = QTimer(self, singleShot=True, interval=700)
        self._burst_key = None

        self.frame = 0.0
        self.playing = True
        self._origin = (time.perf_counter(), 0.0)
        self._last_render = 0.0
        self._dirty = True
        self._feeds_version = -1
        self._clip_label: QLabel | None = None

        self._build_ui()
        self._build_menus()
        self._rebuild_all()

        self._tick_timer = QTimer(self, interval=10)
        self._tick_timer.timeout.connect(self._tick)
        self._tick_timer.start()
        QApplication.instance().installEventFilter(_SpaceToPlay(self))
        self.statusBar().showMessage(f"Rendering on {self.engine.renderer}", 6000)

    # ------------------------------------------------------------- layout ---

    def _build_ui(self):
        split = QSplitter(Qt.Horizontal)
        self.setCentralWidget(split)

        # Left: project + layers
        left = QWidget()
        lv = QVBoxLayout(left)
        form = QFormLayout()
        self.name_edit = QLineEdit()
        self.name_edit.editingFinished.connect(
            lambda: self._set_project("name", self.name_edit.text().strip() or "untitled"))
        self.pack_combo = QComboBox()
        for key, label in PACKS:
            self.pack_combo.addItem(label, key)
        self.pack_combo.currentIndexChanged.connect(
            lambda _i: self._set_project("pack", self.pack_combo.currentData()))
        self.bpm_spin = QDoubleSpinBox()
        self.bpm_spin.setRange(BPM_MIN, BPM_MAX)
        self.bpm_spin.setDecimals(1)
        self.bpm_spin.setKeyboardTracking(False)
        self.bpm_spin.valueChanged.connect(lambda v: self._set_project("bpm", float(v)))
        self.bars_combo = QComboBox()
        for b in BAR_CHOICES:
            self.bars_combo.addItem(f"{b} bars", b)
        self.bars_combo.currentIndexChanged.connect(
            lambda _i: self._set_project("bars", self.bars_combo.currentData()))
        self.timing_label = QLabel()
        self.timing_label.setObjectName("note")
        self.timing_label.setWordWrap(True)
        form.addRow("Name", self.name_edit)
        form.addRow("Style pack", self.pack_combo)
        form.addRow("BPM", self.bpm_spin)
        form.addRow("Loop length", self.bars_combo)
        lv.addLayout(form)
        lv.addWidget(self.timing_label)

        lv.addWidget(_heading("Layers  (top draws over bottom)"))
        self.layer_list = QListWidget()
        self.layer_list.currentItemChanged.connect(self._on_select)
        self.layer_list.itemChanged.connect(self._on_item_changed)
        lv.addWidget(self.layer_list, 1)
        add_row = QHBoxLayout()
        for kind, label in (("footage", "+ Footage"), ("generator", "+ Generator"),
                            ("overlay", "+ Logo / text")):
            b = QPushButton(label)
            b.clicked.connect(lambda _c=False, k=kind: self._add_layer(k))
            add_row.addWidget(b)
        lv.addLayout(add_row)
        edit_row = QHBoxLayout()
        for label, tip, fn in (("Up", "Move layer up (draws over more)", lambda: self._move(1)),
                               ("Down", "Move layer down", lambda: self._move(-1)),
                               ("Duplicate", "Copy this layer", self._duplicate),
                               ("Delete", "Remove this layer", self._delete)):
            b = QPushButton(label)
            b.setToolTip(tip)
            b.clicked.connect(fn)
            edit_row.addWidget(b)
        lv.addLayout(edit_row)
        left.setMinimumWidth(300)
        split.addWidget(left)

        # Center: preview + transport
        center = QWidget()
        cv = QVBoxLayout(center)
        self.preview = QLabel()
        self.preview.setAlignment(Qt.AlignCenter)
        self.preview.setMinimumSize(320, 240)
        self.preview.setSizePolicy(QSizePolicy.Ignored, QSizePolicy.Ignored)
        self.preview.setStyleSheet("background:#000;")
        cv.addWidget(self.preview, 1)
        tr = QHBoxLayout()
        self.play_btn = QPushButton("Pause")
        self.play_btn.setFixedWidth(70)
        self.play_btn.clicked.connect(self._toggle_play)
        tr.addWidget(self.play_btn)
        self.scrub = QSlider(Qt.Horizontal)
        self.scrub.sliderMoved.connect(self._scrub_to)
        self.scrub.sliderPressed.connect(lambda: self._scrub_to(self.scrub.value()))
        tr.addWidget(self.scrub, 1)
        self.pos_label = QLabel()
        self.pos_label.setMinimumWidth(150)
        tr.addWidget(self.pos_label)
        cv.addLayout(tr)
        opts = QHBoxLayout()
        opts.addWidget(QLabel("Preview format"))
        self.format_combo = QComboBox()
        for key, fmt in FORMATS.items():
            self.format_combo.addItem(fmt.label, key)
        self.format_combo.currentIndexChanged.connect(self._on_format)
        opts.addWidget(self.format_combo)
        opts.addWidget(QLabel("Quality"))
        self.quality_combo = QComboBox()
        self.quality_combo.addItems(list(QUALITY))
        self.quality_combo.setCurrentIndex(1)
        self.quality_combo.currentIndexChanged.connect(lambda _i: self._mark_dirty())
        opts.addWidget(self.quality_combo)
        opts.addStretch(1)
        export_btn = QPushButton("Export…")
        export_btn.clicked.connect(self._export)
        opts.addWidget(export_btn)
        cv.addLayout(opts)
        split.addWidget(center)

        # Right: inspector
        self.inspector = QScrollArea()
        self.inspector.setWidgetResizable(True)
        self.inspector.setMinimumWidth(400)
        split.addWidget(self.inspector)
        split.setSizes([320, 760, 420])
        split.setStretchFactor(1, 1)

    def _build_menus(self):
        def act(menu, text, shortcut, fn):
            a = QAction(text, self)
            if shortcut:
                a.setShortcut(QKeySequence(shortcut))
            a.triggered.connect(fn)
            menu.addAction(a)
            return a
        m = self.menuBar().addMenu("File")
        act(m, "New", QKeySequence.New, self._new)
        act(m, "Open…", QKeySequence.Open, self._open)
        act(m, "Save", QKeySequence.Save, self._save)
        act(m, "Save As…", QKeySequence.SaveAs, self._save_as)
        m.addSeparator()
        act(m, "Export…", "Ctrl+E", self._export)
        m = self.menuBar().addMenu("Edit")
        self.undo_act = act(m, "Undo", QKeySequence.Undo, self._undo)
        self.redo_act = act(m, "Redo", QKeySequence.Redo, self._redo)
        tb = self.addToolBar("Main")
        tb.setMovable(False)
        for label, fn in (("New", self._new), ("Open", self._open), ("Save", self._save),
                          ("Undo", self._undo), ("Redo", self._redo), ("Export", self._export)):
            tb.addAction(label, fn)

    # ------------------------------------------------------------- state ---

    def _layer(self, layer_id: str | None = None) -> dict | None:
        lid = layer_id or self.selected
        return next((l for l in self.project["layers"] if l["id"] == lid), None)

    def _timing(self):
        return proj.timing(self.project)

    def _aspect(self) -> str:
        return FORMATS[self.project["preview_format"]].aspect

    def _checkpoint(self, merge_key=None):
        """Call before changing the project. Repeated edits to the same
        control in quick succession (merge_key matches) share one undo step."""
        if merge_key is None or not self._burst.isActive() or merge_key != self._burst_key:
            self.undo_stack.append(copy.deepcopy(self.project))
            del self.undo_stack[:-UNDO_LIMIT]
            self.redo_stack.clear()
        self._burst_key = merge_key
        if merge_key is None:
            self._burst.stop()
        else:
            self._burst.start()
        self._set_modified(True)
        self._mark_dirty()

    def _set_modified(self, value: bool):
        self.modified = value
        name = self.path.stem if self.path else self.project["name"]
        self.setWindowTitle(f"{name}{' •' if value else ''}  —  meridian visuals")

    def _mark_dirty(self):
        self._dirty = True

    def _undo(self):
        self._swap(self.undo_stack, self.redo_stack)

    def _redo(self):
        self._swap(self.redo_stack, self.undo_stack)

    def _swap(self, src: list, dst: list):
        self._burst.stop()
        if not src:
            return
        dst.append(copy.deepcopy(self.project))
        self.project = src.pop()
        if not self._layer() and self.selected != GLOBAL:
            self.selected = self.project["layers"][-1]["id"] if self.project["layers"] else GLOBAL
        self._set_modified(True)
        self._mark_dirty()
        self._rebuild_all()

    def _set_project(self, key, value):
        if self.project.get(key) == value:
            return
        self._checkpoint(merge_key=("project", key) if key == "bpm" else None)
        self.project[key] = value
        self._refresh_timing()
        if key == "name":
            self._set_modified(True)

    # ----------------------------------------------------------- rebuild ---

    def _rebuild_all(self):
        p = self.project
        for w in (self.name_edit, self.pack_combo, self.bpm_spin, self.bars_combo, self.format_combo):
            w.blockSignals(True)
        self.name_edit.setText(p["name"])
        self.pack_combo.setCurrentIndex(self.pack_combo.findData(p["pack"]))
        self.bpm_spin.setValue(p["bpm"])
        self.bars_combo.setCurrentIndex(self.bars_combo.findData(p["bars"]))
        self.format_combo.setCurrentIndex(self.format_combo.findData(p["preview_format"]))
        for w in (self.name_edit, self.pack_combo, self.bpm_spin, self.bars_combo, self.format_combo):
            w.blockSignals(False)
        self._refresh_timing()
        self._rebuild_layers()
        self._rebuild_inspector()

    def _refresh_timing(self):
        t = self._timing()
        self.timing_label.setText(t.describe())
        self.scrub.setRange(0, t.frames - 1)
        self.frame %= t.frames
        self._mark_dirty()

    def _rebuild_layers(self):
        lw = self.layer_list
        lw.blockSignals(True)
        lw.clear()
        g = QListWidgetItem("Global effects (whole frame)")
        g.setData(Qt.UserRole, GLOBAL)
        lw.addItem(g)
        for layer in reversed(self.project["layers"]):
            it = QListWidgetItem(layer["name"])
            it.setData(Qt.UserRole, layer["id"])
            it.setFlags(it.flags() | Qt.ItemIsUserCheckable | Qt.ItemIsEditable)
            it.setCheckState(Qt.Checked if layer["visible"] else Qt.Unchecked)
            it.setToolTip("Tick to show/hide. Double-click to rename.")
            lw.addItem(it)
        for i in range(lw.count()):
            if lw.item(i).data(Qt.UserRole) == self.selected:
                lw.setCurrentRow(i)
        lw.blockSignals(False)

    def _rebuild_inspector(self):
        scroll = self.inspector.verticalScrollBar().value()
        old = self.inspector.takeWidget()
        if old:
            old.deleteLater()
        self._clip_label = None
        body = QWidget()
        v = QVBoxLayout(body)
        v.setSpacing(10)
        if self.selected == GLOBAL:
            v.addWidget(_heading("Global effects"))
            v.addWidget(_note("Applied to the whole frame after all layers are stacked."))
            for key in EFFECT_ORDER:
                v.addWidget(self._box(EFFECTS[key],
                                      lambda k=key: self.project["global_effects"][k]))
        else:
            layer = self._layer()
            if layer:
                self._layer_inspector(layer, v)
        v.addStretch(1)
        self.inspector.setWidget(body)
        QTimer.singleShot(0, lambda: self.inspector.verticalScrollBar().setValue(scroll))

    def _layer_inspector(self, layer: dict, v: QVBoxLayout):
        lid = layer["id"]
        L = lambda: self._layer(lid)
        kind = layer["type"]
        if kind == "footage":
            v.addWidget(self._box(FOOTAGE, lambda: L()["params"], rebuild_on={"source"}))
            self._clip_label = _note("")
            v.addWidget(self._clip_label)
            self._update_clip_label()
            aspect = self._aspect()
            v.addWidget(self._box(
                FRAMING, lambda: L()["framing"][self._aspect()], title=f"Framing ({aspect})",
                note=f"Saved separately per aspect. Switch 'Preview format' to frame "
                     f"other shapes, e.g. 9:16 for Reels."))
        elif kind == "generator":
            v.addWidget(self._box(generator_section(), lambda: L()["params"],
                                  rebuild_on={"shader"}))
            gen = generators()[layer["params"]["shader"]]
            v.addWidget(self._box(gen.section,
                                  lambda: L()["params"]["shader_params"][L()["params"]["shader"]],
                                  title=f"{gen.name} settings"))
            if lid in self.engine.errors:
                err = QPlainTextEdit(self.engine.errors[lid])
                err.setReadOnly(True)
                v.addWidget(err)
        elif kind == "overlay":
            mode = layer["params"]["mode"]
            hidden = {"text", "font", "color"} if mode == "image" else {"source"}
            v.addWidget(self._box(OVERLAY, lambda: L()["params"], rebuild_on={"mode"},
                                  hidden=hidden))
        v.addWidget(self._box(LAYER_COMMON, lambda: L()["layer"]))
        v.addWidget(_heading("Layer effects"))
        for key in EFFECT_ORDER:
            v.addWidget(self._box(EFFECTS[key], lambda k=key: L()["effects"][k]))

    def _box(self, section, get, title=None, rebuild_on=frozenset(), hidden=frozenset(), note=""):
        def on_change(key, value):
            if get().get(key) == value:
                return
            merge = None if key in rebuild_on else (self.selected, section.key, title, key)
            self._checkpoint(merge_key=merge)
            get()[key] = value
            if key in rebuild_on:
                self._after_structural_change(key, value)

        def on_replace(values):
            self._checkpoint()
            get().update(values)
            QTimer.singleShot(0, self._rebuild_inspector)

        def start_dir():
            return self.last_media_dir

        return SectionBox(section, get, on_change, on_replace, title=title, hidden=hidden,
                          start_dir=start_dir, note=note)

    def _after_structural_change(self, key, value):
        layer = self._layer()
        if layer is not None:
            idx = self.project["layers"].index(layer)
            self.project["layers"][idx] = proj.normalize_layer(layer)
            if key == "shader":
                gens = generators()
                auto_names = {g.name for g in gens.values()} | {"Generator"}
                if layer["name"] in auto_names:
                    self.project["layers"][idx]["name"] = gens[value].name
                    QTimer.singleShot(0, self._rebuild_layers)
            if key == "source" and value:
                self.last_media_dir = str(Path(value).parent)
                if layer["type"] == "footage":
                    self.feeds.request(value)
                    if layer["name"] == "Footage":
                        self.project["layers"][idx]["name"] = Path(value).stem
                        QTimer.singleShot(0, self._rebuild_layers)
        QTimer.singleShot(0, self._rebuild_inspector)

    def _update_clip_label(self):
        if self._clip_label is None:
            return
        layer = self._layer()
        if not layer or layer["type"] != "footage":
            return
        src = layer["params"]["source"]
        if not src:
            self._clip_label.setText("Choose a video file to start.")
            return
        if not Path(src).exists():
            self._clip_label.setText(f"File not found: {src}")
            return
        try:
            info = media.probe(src)
        except Exception as e:
            self._clip_label.setText(f"Could not read this file: {e}")
            return
        lines = [f"{info.width}x{info.height} · {info.fps:.2f} fps · {info.duration:.1f}s"]
        if info.fps >= 100:
            lines.append(f"High frame rate: speed {30 / info.fps:.2f} plays every frame "
                         f"({info.fps / 30:.0f}x smooth slow motion).")
        if info.hdr:
            lines.append("HDR clip: colors will look flat. Use the Color effect to add "
                         "contrast/saturation for now (see README).")
        status = self.feeds.status.get(src)
        if status == "pending":
            lines.append("Making a preview copy (one-time)…")
        elif status and status != "ready":
            lines.append(status)
        warning = media.plan(layer["params"], info, self._timing()).warning
        if warning:
            lines.append("⚠ " + warning)
        self._clip_label.setText("\n".join(lines))

    # ------------------------------------------------------------ layers ---

    def _on_select(self, cur, _prev):
        if cur is None:
            return
        self.selected = cur.data(Qt.UserRole)
        self._rebuild_inspector()

    def _on_item_changed(self, item: QListWidgetItem):
        layer = self._layer(item.data(Qt.UserRole))
        if not layer:
            return
        visible = item.checkState() == Qt.Checked
        name = item.text().strip() or layer["name"]
        if visible != layer["visible"] or name != layer["name"]:
            self._checkpoint()
            layer["visible"], layer["name"] = visible, name

    def _add_layer(self, kind: str):
        self._checkpoint()
        layer = proj.new_layer(kind)
        if kind == "overlay" and proj.DEFAULT_LOGO.exists():
            layer["params"]["source"] = str(proj.DEFAULT_LOGO)
        idx = len(self.project["layers"])
        cur = self._layer()
        if cur is not None:
            idx = self.project["layers"].index(cur) + 1
        self.project["layers"].insert(idx, layer)
        self.selected = layer["id"]
        self._rebuild_layers()
        self._rebuild_inspector()

    def _move(self, direction: int):
        layer = self._layer()
        if not layer:
            return
        layers = self.project["layers"]
        i = layers.index(layer)
        j = i + direction
        if 0 <= j < len(layers):
            self._checkpoint()
            layers[i], layers[j] = layers[j], layers[i]
            self._rebuild_layers()

    def _duplicate(self):
        layer = self._layer()
        if not layer:
            return
        self._checkpoint()
        dup = copy.deepcopy(layer)
        dup["id"] = proj.new_layer(layer["type"])["id"]
        dup["name"] = layer["name"] + " copy"
        self.project["layers"].insert(self.project["layers"].index(layer) + 1, dup)
        self.selected = dup["id"]
        self._rebuild_layers()
        self._rebuild_inspector()

    def _delete(self):
        layer = self._layer()
        if not layer:
            return
        self._checkpoint()
        i = self.project["layers"].index(layer)
        self.project["layers"].remove(layer)
        rest = self.project["layers"]
        self.selected = rest[max(0, i - 1)]["id"] if rest else GLOBAL
        self._rebuild_layers()
        self._rebuild_inspector()

    # ----------------------------------------------------------- preview ---

    def _on_format(self, _i):
        key = self.format_combo.currentData()
        if key != self.project["preview_format"]:
            self.project["preview_format"] = key   # a view setting: not an undo step
            self._mark_dirty()
            self._rebuild_inspector()

    def _toggle_play(self):
        self.playing = not self.playing
        self._origin = (time.perf_counter(), self.frame)
        self.play_btn.setText("Pause" if self.playing else "Play")

    def _scrub_to(self, value):
        self.frame = float(value)
        self._origin = (time.perf_counter(), self.frame)
        self._mark_dirty()

    def _preview_size(self) -> tuple[int, int]:
        fmt = FORMATS[self.project["preview_format"]]
        long_side, _ = QUALITY[self.quality_combo.currentText()]
        s = long_side / max(fmt.width, fmt.height)
        return (max(2, round(fmt.width * s / 2) * 2), max(2, round(fmt.height * s / 2) * 2))

    def _tick(self):
        now = time.perf_counter()
        t = self._timing()
        _, fps = QUALITY[self.quality_combo.currentText()]
        if self.feeds.version != self._feeds_version:
            self._feeds_version = self.feeds.version
            self._update_clip_label()
            self._dirty = True
        if self.playing:
            self.frame = (self._origin[1] + (now - self._origin[0]) * FPS) % t.frames
            due = now - self._last_render >= 1.0 / fps
        else:
            due = False
        if not (due or self._dirty):
            return
        self._last_render = now
        self._dirty = False
        size = self._preview_size()
        try:
            with self.engine.ctx:
                final = self.engine.render(self.project, self.frame, size, self._aspect(),
                                           self.feeds, t)
                data = self.engine.read_rgb(final)
        except Exception as e:
            traceback.print_exc()
            self.statusBar().showMessage(f"Preview error: {e}", 5000)
            return
        img = QImage(data, size[0], size[1], size[0] * 3, QImage.Format_RGB888).copy()
        pix = QPixmap.fromImage(img).scaled(self.preview.size(), Qt.KeepAspectRatio,
                                            Qt.SmoothTransformation)
        self.preview.setPixmap(pix)
        self.scrub.blockSignals(True)
        self.scrub.setValue(int(self.frame))
        self.scrub.blockSignals(False)
        beat = t.beat_position(self.frame)
        self.pos_label.setText(f"bar {int(beat // 4) + 1}/{t.bars}  ·  beat {int(beat % 4) + 1}")
        if self.selected in self.engine.errors:
            self.statusBar().showMessage("Shader error on this layer (see inspector)", 2000)

    # -------------------------------------------------------------- files ---

    def _confirm_discard(self) -> bool:
        if not self.modified:
            return True
        r = QMessageBox.question(self, "Unsaved changes", "Save changes to this project first?",
                                 QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel)
        if r == QMessageBox.Save:
            return self._save()
        return r == QMessageBox.Discard

    def _load_project(self, project: dict, path: Path | None):
        self.project = project
        self.path = path
        self.undo_stack.clear()
        self.redo_stack.clear()
        self.selected = project["layers"][-1]["id"] if project["layers"] else GLOBAL
        self.frame = 0.0
        self._origin = (time.perf_counter(), 0.0)
        for layer in project["layers"]:
            if layer["type"] == "footage" and layer["params"]["source"]:
                self.feeds.request(layer["params"]["source"])
        self._set_modified(False)
        self._rebuild_all()

    def _new(self):
        if self._confirm_discard():
            self._load_project(proj.new_project(), None)

    def _open(self):
        if not self._confirm_discard():
            return
        path, _ = QFileDialog.getOpenFileName(self, "Open project", str(PROJECT_DIR),
                                              "Visuals project (*.json)")
        if path:
            try:
                self._load_project(proj.load(path), Path(path))
            except Exception as e:
                QMessageBox.warning(self, "Open failed", f"Couldn't open that project:\n{e}")

    def _save(self) -> bool:
        if self.path is None:
            return self._save_as()
        proj.save(self.project, self.path)
        self._set_modified(False)
        self.statusBar().showMessage(f"Saved {self.path.name}", 3000)
        return True

    def _save_as(self) -> bool:
        PROJECT_DIR.mkdir(exist_ok=True)
        default = PROJECT_DIR / f"{proj.slug(self.project['name'])}.json"
        path, _ = QFileDialog.getSaveFileName(self, "Save project", str(default),
                                              "Visuals project (*.json)")
        if not path:
            return False
        self.path = Path(path)
        return self._save()

    def _export(self):
        dlg = ExportDialog(copy.deepcopy(self.project), self)
        dlg.exec()
        # Remember chosen formats/folder for next time (not an undo step).
        self.project["export"] = dlg.project["export"]

    def closeEvent(self, e):
        if self._confirm_discard():
            e.accept()
        else:
            e.ignore()


class _SpaceToPlay(QObject):
    """Space toggles play/pause unless you're typing in a text/number box."""

    def __init__(self, win: MainWindow):
        super().__init__(win)
        self.win = win

    def eventFilter(self, obj, ev):
        if ev.type() == QEvent.KeyPress and ev.key() == Qt.Key_Space and not ev.isAutoRepeat():
            focus = QApplication.focusWidget()
            if not isinstance(focus, (QLineEdit, QPlainTextEdit, QAbstractSpinBox)) \
                    and self.win.isActiveWindow():
                self.win._toggle_play()
                return True
        return False


def _heading(text: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setObjectName("heading")
    return lbl


def _note(text: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setObjectName("note")
    lbl.setWordWrap(True)
    return lbl
