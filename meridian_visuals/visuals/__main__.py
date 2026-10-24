"""Launch the app:  python -m visuals"""
import sys

from PySide6.QtGui import QColor, QPalette
from PySide6.QtWidgets import QApplication

STYLE = """
QLabel#heading { font-weight: 600; font-size: 13px; padding-top: 6px; }
QLabel#note { color: #9a9a9a; font-size: 11px; }
QGroupBox { border: 1px solid #3a3a3a; border-radius: 6px; margin-top: 14px; padding-top: 6px; }
QGroupBox::title { subcontrol-origin: margin; left: 8px; padding: 0 4px; font-weight: 600; }
QToolButton { padding: 2px 8px; }
"""


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("meridian visuals")
    app.setStyle("Fusion")
    pal = QPalette()
    for role, color in ((QPalette.Window, "#1e1e1e"), (QPalette.WindowText, "#e6e6e6"),
                        (QPalette.Base, "#141414"), (QPalette.AlternateBase, "#232323"),
                        (QPalette.Text, "#e6e6e6"), (QPalette.Button, "#2b2b2b"),
                        (QPalette.ButtonText, "#e6e6e6"), (QPalette.Highlight, "#4a7a64"),
                        (QPalette.HighlightedText, "#ffffff"), (QPalette.ToolTipBase, "#2b2b2b"),
                        (QPalette.ToolTipText, "#e6e6e6"), (QPalette.PlaceholderText, "#777777")):
        pal.setColor(role, QColor(color))
    app.setPalette(pal)
    app.setStyleSheet(STYLE)

    from .ui.main_window import MainWindow   # after QApplication exists
    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
