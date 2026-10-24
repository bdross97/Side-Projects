"""Export dialog: pick formats + folder, then run visuals.export in a
separate process and show its progress."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PySide6.QtCore import QProcess
from PySide6.QtWidgets import (QCheckBox, QDialog, QFileDialog, QHBoxLayout, QLabel, QLineEdit,
                               QPlainTextEdit, QProgressBar, QPushButton, QVBoxLayout)

from .. import APP_DIR, CACHE_DIR
from .. import project as proj
from ..schema import FORMATS


class ExportDialog(QDialog):
    def __init__(self, project: dict, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Export")
        self.setMinimumWidth(560)
        self.project = project
        self.proc: QProcess | None = None
        lay = QVBoxLayout(self)

        t = proj.timing(project)
        info = QLabel(f"<b>{t.describe()}</b><br>H.264 MP4, 30 fps. Each format uses the "
                      f"framing you set for its aspect ratio.")
        info.setWordWrap(True)
        lay.addWidget(info)

        self.checks = {}
        for key, fmt in FORMATS.items():
            cb = QCheckBox(fmt.label)
            cb.setChecked(key in project["export"]["formats"])
            cb.toggled.connect(self._refresh_names)
            self.checks[key] = cb
            lay.addWidget(cb)

        row = QHBoxLayout()
        row.addWidget(QLabel("Folder"))
        self.folder = QLineEdit(project["export"]["folder"])
        self.folder.textChanged.connect(self._refresh_names)
        row.addWidget(self.folder, 1)
        browse = QPushButton("Choose…")
        browse.clicked.connect(self._browse)
        row.addWidget(browse)
        lay.addLayout(row)

        self.names = QLabel()
        self.names.setObjectName("note")
        self.names.setWordWrap(True)
        lay.addWidget(self.names)

        self.progress = QProgressBar()
        self.progress.setVisible(False)
        lay.addWidget(self.progress)
        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumHeight(140)
        self.log.setVisible(False)
        lay.addWidget(self.log)

        btns = QHBoxLayout()
        self.open_btn = QPushButton("Show in Finder")
        self.open_btn.setVisible(False)
        self.open_btn.clicked.connect(lambda: subprocess.run(["open", self.folder.text()]))
        btns.addWidget(self.open_btn)
        btns.addStretch(1)
        self.cancel_btn = QPushButton("Close")
        self.cancel_btn.clicked.connect(self._cancel)
        self.go_btn = QPushButton("Export")
        self.go_btn.setDefault(True)
        self.go_btn.clicked.connect(self._start)
        btns.addWidget(self.cancel_btn)
        btns.addWidget(self.go_btn)
        lay.addLayout(btns)
        self._refresh_names()

    def selected(self) -> list[str]:
        return [k for k, cb in self.checks.items() if cb.isChecked()]

    def _refresh_names(self):
        names = [proj.export_filename(self.project, k) for k in self.selected()]
        self.names.setText("Files:\n" + "\n".join(names) if names else "Pick at least one format.")
        self.go_btn.setEnabled(bool(names) and self.proc is None)

    def _browse(self):
        d = QFileDialog.getExistingDirectory(self, "Export folder", self.folder.text())
        if d:
            self.folder.setText(d)

    def _start(self):
        self.project["export"]["formats"] = self.selected()
        self.project["export"]["folder"] = self.folder.text()
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        job = CACHE_DIR / "export_job.json"
        proj.save(self.project, job)
        self.progress.setVisible(True)
        self.progress.setValue(0)
        self.log.setVisible(True)
        self.log.clear()
        self.go_btn.setEnabled(False)
        self.cancel_btn.setText("Cancel")
        self.open_btn.setVisible(False)
        self.proc = QProcess(self)
        self.proc.setWorkingDirectory(str(APP_DIR))
        self.proc.setProcessChannelMode(QProcess.MergedChannels)
        self.proc.readyReadStandardOutput.connect(self._read)
        self.proc.finished.connect(self._finished)
        self.proc.start(sys.executable, ["-m", "visuals.export", str(job),
                                         "--formats", *self.selected(), "--out", self.folder.text()])

    def _read(self):
        text = bytes(self.proc.readAllStandardOutput()).decode(errors="replace")
        for line in text.splitlines():
            if line.startswith("PROGRESS"):
                _, n, total, i, frames, *label = line.split()
                n, total, i, frames = int(n), int(total), int(i), int(frames)
                self.progress.setValue(int(((n - 1) + i / frames) / total * 100))
                self.progress.setFormat(f"{' '.join(label)}  ({n}/{total})  %p%")
            else:
                self.log.appendPlainText(line)

    def _finished(self, code, _status):
        self.proc = None
        self.cancel_btn.setText("Close")
        self.go_btn.setEnabled(True)
        if code == 0:
            self.progress.setValue(100)
            self.progress.setFormat("Done")
            self.open_btn.setVisible(True)
        else:
            self.progress.setFormat("Stopped")

    def _cancel(self):
        if self.proc is not None:
            self.proc.terminate()
            self.log.appendPlainText("Cancelled.")
        else:
            self.accept()

    def closeEvent(self, e):
        if self.proc is not None:
            self.proc.terminate()
            self.proc.waitForFinished(3000)
        super().closeEvent(e)
