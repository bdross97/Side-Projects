"""
Golf Stats ETL Pipeline
Loads GolfShot (scraped_data.xlsx) and manual entry (golf_stats.xlsx) data,
normalizes them to a unified schema, and writes to SQLite.
"""

import sqlite3
import pandas as pd
from pathlib import Path

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DATA_DIR = Path("/Users/Brayd/Desktop/Data Science Projects/Golf Stats")
DB_PATH = BASE_DIR / "golf_stats.db"

MANUAL_FILE = DATA_DIR / "golf_stats.xlsx"
GOLFSHOT_FILE = DATA_DIR / "scraped_data.xlsx"
GRINT_FILE = DATA_DIR / "grint_scraped.xlsx"  # produced by grint_scraping.py
COURSE_FILE = DATA_DIR / "course_data.xlsx"

# ─── Normalization Helpers ────────────────────────────────────────────────────

# Normalize course names that The Grint truncates with "..." in the UI
COURSE_NAME_MAP = {
    "Stonebridge Golf Clu": "Stonebridge Golf Club",
}


FAIRWAY_MAP = {
    # manual entry format
    "hit": "Hit",
    "missed left": "Left",
    "missed right": "Right",
    "missed short": "Short",
    "missed long": "Long",
    # golfshot format
    "left": "Left",
    "right": "Right",
    "unknown": "Unknown",
    # grint (TBD — add as discovered)
}

GREEN_MAP = {
    # manual entry format
    "hit": "Hit",
    "missed left": "Left",
    "missed right": "Right",
    "missed short": "Short",
    "missed long": "Long",
    # golfshot format ("Miss" has no direction)
    "miss": "Unknown",
    # grint (TBD)
}


def normalize_fairway(val):
    if pd.isna(val):
        return None
    return FAIRWAY_MAP.get(str(val).strip().lower(), str(val).strip())


def normalize_green(val):
    if pd.isna(val):
        return None
    return GREEN_MAP.get(str(val).strip().lower(), str(val).strip())


def parse_date(val):
    """Return ISO date string (YYYY-MM-DD) from various input formats."""
    if pd.isna(val):
        return None
    if isinstance(val, pd.Timestamp):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    # Try "Sep 22, 2022" format
    try:
        return pd.to_datetime(s, format="%b %d, %Y").strftime("%Y-%m-%d")
    except Exception:
        pass
    # Generic parse
    try:
        return pd.to_datetime(s).strftime("%Y-%m-%d")
    except Exception:
        return s


def safe_int(val):
    try:
        if pd.isna(val):
            return None
        return int(val)
    except Exception:
        return None


def safe_float(val):
    try:
        if pd.isna(val):
            return None
        return float(val)
    except Exception:
        return None


def safe_str(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    return s if s else None


# ─── Database Setup ───────────────────────────────────────────────────────────

CREATE_ROUNDS = """
CREATE TABLE IF NOT EXISTS rounds (
    round_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    course_name TEXT NOT NULL,
    source TEXT NOT NULL,
    total_score INTEGER,
    handicap_differential REAL,
    holes_played INTEGER DEFAULT 18,
    UNIQUE(date, course_name, source)
)
"""

CREATE_HOLES = """
CREATE TABLE IF NOT EXISTS holes (
    hole_id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL REFERENCES rounds(round_id),
    hole_number INTEGER NOT NULL,
    par INTEGER,
    yardage INTEGER,
    handicap_rating INTEGER,
    hole_shape TEXT,
    score INTEGER,
    score_relative INTEGER,
    tee_club TEXT,
    fairway_hit TEXT,
    approach_club TEXT,
    distance_to_green INTEGER,
    second_approach_club TEXT,
    second_distance_to_green INTEGER,
    green_status TEXT,
    putts INTEGER,
    penalties INTEGER,
    bunker_type TEXT,
    UNIQUE(round_id, hole_number)
)
"""

CREATE_COURSES = """
CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    hole INTEGER NOT NULL,
    par INTEGER,
    yardage INTEGER,
    handicap_rating INTEGER,
    hole_shape TEXT,
    UNIQUE(course_name, hole)
)
"""

CREATE_CLUBS = """
CREATE TABLE IF NOT EXISTS clubs (
    club_id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_name TEXT NOT NULL UNIQUE,
    type TEXT
)
"""


def init_db(conn):
    cur = conn.cursor()
    for stmt in [CREATE_ROUNDS, CREATE_HOLES, CREATE_COURSES, CREATE_CLUBS]:
        cur.execute(stmt)
    conn.commit()


# ─── ETL Functions ────────────────────────────────────────────────────────────

def upsert_round(conn, date, course_name, source, total_score=None, hc_diff=None, holes_played=18):
    """Insert or return existing round_id."""
    cur = conn.cursor()
    cur.execute(
        """INSERT OR IGNORE INTO rounds (date, course_name, source, total_score, handicap_differential, holes_played)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (date, course_name, source, total_score, hc_diff, holes_played),
    )
    conn.commit()
    cur.execute(
        "SELECT round_id FROM rounds WHERE date=? AND course_name=? AND source=?",
        (date, course_name, source),
    )
    row = cur.fetchone()
    return row[0] if row else None


def upsert_hole(conn, round_id, hole_dict):
    """Insert or replace hole record."""
    cur = conn.cursor()
    cur.execute(
        """INSERT OR REPLACE INTO holes
           (round_id, hole_number, par, yardage, handicap_rating, hole_shape,
            score, score_relative, tee_club, fairway_hit, approach_club,
            distance_to_green, second_approach_club, second_distance_to_green,
            green_status, putts, penalties, bunker_type)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            round_id,
            hole_dict.get("hole_number"),
            hole_dict.get("par"),
            hole_dict.get("yardage"),
            hole_dict.get("handicap_rating"),
            hole_dict.get("hole_shape"),
            hole_dict.get("score"),
            hole_dict.get("score_relative"),
            hole_dict.get("tee_club"),
            hole_dict.get("fairway_hit"),
            hole_dict.get("approach_club"),
            hole_dict.get("distance_to_green"),
            hole_dict.get("second_approach_club"),
            hole_dict.get("second_distance_to_green"),
            hole_dict.get("green_status"),
            hole_dict.get("putts"),
            hole_dict.get("penalties"),
            hole_dict.get("bunker_type"),
        ),
    )


def load_manual_entry(conn):
    """Load golf_stats.xlsx (manual entry data) → SQLite."""
    if not MANUAL_FILE.exists():
        print(f"[SKIP] Manual entry file not found: {MANUAL_FILE}")
        return 0

    print(f"[LOAD] Manual entry: {MANUAL_FILE}")
    df = pd.read_excel(MANUAL_FILE, engine="openpyxl")

    # Drop junk columns
    df = df.drop(columns=["Unnamed: 17", "Unnamed: 18"], errors="ignore")

    # Normalize
    df["_date"] = df["Date"].apply(parse_date)
    df["_fairway"] = df["Fairway Hit"].apply(normalize_fairway)
    df["_green"] = df["Green Status"].apply(normalize_green)

    inserted = 0
    for (date, course), grp in df.groupby(["_date", "Course Name"]):
        total_score = grp["Score"].sum()
        round_id = upsert_round(conn, date, str(course), "manual", safe_int(total_score))
        for _, row in grp.iterrows():
            par = safe_int(row.get("Par"))
            score = safe_int(row.get("Score"))
            score_rel = (score - par) if (score is not None and par is not None) else None
            hole_dict = {
                "hole_number": safe_int(row.get("Hole")),
                "par": par,
                "yardage": safe_int(row.get("Yardage")),
                "handicap_rating": safe_int(row.get("Handicap")),
                "hole_shape": None,
                "score": score,
                "score_relative": score_rel,
                "tee_club": safe_str(row.get("Tee Club")),
                "fairway_hit": row["_fairway"],
                "approach_club": safe_str(row.get("Approach Club")),
                "distance_to_green": safe_int(row.get("Distance to Green")),
                "second_approach_club": safe_str(row.get("Second Approach Club")),
                "second_distance_to_green": safe_int(row.get("Second Distance to Green")),
                "green_status": row["_green"],
                "putts": safe_int(row.get("Putts")),
                "penalties": safe_int(row.get("Penalties")),
                "bunker_type": safe_str(row.get("Bunker Type")),
            }
            upsert_hole(conn, round_id, hole_dict)
            inserted += 1
    conn.commit()
    print(f"  → {inserted} hole records processed (manual)")
    return inserted


def load_golfshot(conn):
    """Load scraped_data.xlsx (GolfShot scraper) → SQLite."""
    if not GOLFSHOT_FILE.exists():
        print(f"[SKIP] GolfShot file not found: {GOLFSHOT_FILE}")
        return 0

    print(f"[LOAD] GolfShot scrape: {GOLFSHOT_FILE}")
    df = pd.read_excel(GOLFSHOT_FILE, engine="openpyxl")

    df["_date"] = df["Date"].apply(parse_date)
    df["_fairway"] = df["Fairway Hit"].apply(normalize_fairway)
    df["_green"] = df["Green Status"].apply(normalize_green)

    inserted = 0
    for (date, course), grp in df.groupby(["_date", "Course Name"]):
        total_score = grp["Score"].sum()
        round_id = upsert_round(conn, date, str(course), "golfshot", safe_int(total_score))
        for _, row in grp.iterrows():
            par = safe_int(row.get("Par"))
            score = safe_int(row.get("Score"))
            score_rel = (score - par) if (score is not None and par is not None) else None
            bunker_shots = safe_int(row.get("Bunker Shots"))
            bunker_type = "Bunker" if bunker_shots and bunker_shots > 0 else None
            hole_dict = {
                "hole_number": safe_int(row.get("Hole")),
                "par": par,
                "yardage": safe_int(row.get("Yardage")),
                "handicap_rating": safe_int(row.get("Handicap")),
                "hole_shape": None,
                "score": score,
                "score_relative": score_rel,
                "tee_club": safe_str(row.get("Tee Club")),
                "fairway_hit": row["_fairway"],
                "approach_club": None,  # GolfShot doesn't have approach data
                "distance_to_green": None,
                "second_approach_club": None,
                "second_distance_to_green": None,
                "green_status": row["_green"],
                "putts": safe_int(row.get("Putts")),
                "penalties": safe_int(row.get("Penalties")),
                "bunker_type": bunker_type,
            }
            upsert_hole(conn, round_id, hole_dict)
            inserted += 1
    conn.commit()
    print(f"  → {inserted} hole records processed (golfshot)")
    return inserted


def load_grint(conn):
    """Load grint_scraped.xlsx (The Grint scraper) → SQLite."""
    if not GRINT_FILE.exists():
        print(f"[SKIP] Grint file not found: {GRINT_FILE}")
        return 0

    print(f"[LOAD] Grint scrape: {GRINT_FILE}")
    df = pd.read_excel(GRINT_FILE, engine="openpyxl")

    df["_date"] = df["Date"].apply(parse_date)
    # Grint fairway/green normalization — adjust column names as needed after first scrape
    fw_col = "Fairway Hit" if "Fairway Hit" in df.columns else None
    gs_col = "Green Status" if "Green Status" in df.columns else None
    df["_fairway"] = df[fw_col].apply(normalize_fairway) if fw_col else None
    df["_green"] = df[gs_col].apply(normalize_green) if gs_col else None

    inserted = 0
    for (date, course), grp in df.groupby(["_date", "Course Name"]):
        # For 9-hole rounds, Holes Played=9; only keep holes 1–holes_played
        holes_played = safe_int(grp["Holes Played"].iloc[0]) if "Holes Played" in grp.columns else 18
        if holes_played and holes_played < 18:
            grp = grp[grp["Hole"] <= holes_played]
        # Exclude zero-score holes (unplayed)
        grp = grp[grp["Score"].fillna(0) != 0]
        if grp.empty:
            continue
        hc_diff = safe_float(grp["Handicap Differential"].iloc[0]) if "Handicap Differential" in grp.columns else None
        total_score = safe_int(grp["Total Score"].iloc[0]) if "Total Score" in grp.columns else safe_int(grp["Score"].sum())
        round_id = upsert_round(conn, date, str(course), "grint", total_score, hc_diff, holes_played or 18)
        for _, row in grp.iterrows():
            par = safe_int(row.get("Par"))
            score = safe_int(row.get("Score"))
            score_rel = (score - par) if (score is not None and par is not None) else None
            hole_dict = {
                "hole_number": safe_int(row.get("Hole")),
                "par": par,
                "yardage": safe_int(row.get("Yardage")),
                "handicap_rating": safe_int(row.get("Handicap")),
                "hole_shape": safe_str(row.get("Hole Shape")),
                "score": score,
                "score_relative": score_rel,
                "tee_club": safe_str(row.get("Tee Club")),
                "fairway_hit": row["_fairway"] if fw_col else None,
                "approach_club": safe_str(row.get("Approach Club")),
                "distance_to_green": safe_int(row.get("Distance to Green")),
                "second_approach_club": safe_str(row.get("Second Approach Club")),
                "second_distance_to_green": safe_int(row.get("Second Distance to Green")),
                "green_status": row["_green"] if gs_col else None,
                "putts": safe_int(row.get("Putts")),
                "penalties": safe_int(row.get("Penalties")),
                "bunker_type": safe_str(row.get("Bunker Type")),
            }
            upsert_hole(conn, round_id, hole_dict)
            inserted += 1
    conn.commit()
    print(f"  → {inserted} hole records processed (grint)")
    return inserted


def load_courses(conn):
    """Load course_data.xlsx → courses table."""
    if not COURSE_FILE.exists():
        print(f"[SKIP] Course file not found: {COURSE_FILE}")
        return

    print(f"[LOAD] Course data: {COURSE_FILE}")
    df = pd.read_excel(COURSE_FILE, engine="openpyxl")

    cur = conn.cursor()
    count = 0
    for _, row in df.iterrows():
        cur.execute(
            """INSERT OR IGNORE INTO courses (course_name, hole, par, yardage, handicap_rating, hole_shape)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                safe_str(row.get("Course Name")),
                safe_int(row.get("Hole")),
                safe_int(row.get("Par")),
                safe_int(row.get("Yardage")),
                safe_int(row.get("Handicap")),
                safe_str(row.get("Hole Shape")),
            ),
        )
        count += 1
    conn.commit()
    print(f"  → {count} course-hole records loaded")


def load_clubs(conn):
    """Seed clubs table with known bag."""
    clubs = [
        ("Driver", "Driver"),
        ("3W", "Wood"),
        ("3W - HiBore XLS", "Wood"),
        ("3H", "Hybrid"),
        ("2Hy", "Hybrid"),
        ("4i", "Iron"),
        ("5i", "Iron"),
        ("6i", "Iron"),
        ("7i", "Iron"),
        ("8i", "Iron"),
        ("9i", "Iron"),
        ("PW", "Wedge"),
        ("GW", "Wedge"),
        ("56", "Wedge"),
        ("60", "Wedge"),
        ("Putter", "Putter"),
    ]
    cur = conn.cursor()
    for name, typ in clubs:
        cur.execute(
            "INSERT OR IGNORE INTO clubs (club_name, type) VALUES (?, ?)", (name, typ)
        )
    conn.commit()
    print(f"  → {len(clubs)} clubs seeded")


# ─── Main ─────────────────────────────────────────────────────────────────────

def run_pipeline(db_path=None):
    path = db_path or DB_PATH
    print(f"\nGolf Stats ETL Pipeline")
    print(f"Database: {path}\n")

    conn = sqlite3.connect(path)
    init_db(conn)

    load_courses(conn)
    load_clubs(conn)
    load_manual_entry(conn)
    load_golfshot(conn)
    load_grint(conn)

    # Summary
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM rounds")
    rounds_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM holes")
    holes_count = cur.fetchone()[0]
    cur.execute("SELECT source, COUNT(*) FROM rounds GROUP BY source")
    by_source = cur.fetchall()

    print(f"\n{'='*40}")
    print(f"Pipeline complete.")
    print(f"  Rounds: {rounds_count}")
    print(f"  Holes:  {holes_count}")
    print(f"  By source:")
    for src, cnt in by_source:
        print(f"    {src}: {cnt} rounds")
    print(f"{'='*40}\n")

    conn.close()


if __name__ == "__main__":
    run_pipeline()
