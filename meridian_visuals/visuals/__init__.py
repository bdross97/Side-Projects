"""meridian / The TECHOMA visuals generator."""
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
APP_DIR = PACKAGE_DIR.parent
SHADER_DIR = PACKAGE_DIR / "shaders"
CACHE_DIR = APP_DIR / "cache"
EXPORT_DIR = APP_DIR / "exports"
PROJECT_DIR = APP_DIR / "projects"

FPS = 30
