"""
The Grint Scraper
Logs in via requests, scrapes all rounds + hole-by-hole data, outputs grint_scraped.xlsx.
Run: python3 golf_stats/grint_scraping.py
Then: python3 golf_stats/data_pipeline.py  (to ETL into SQLite)

Field map from The Grint scorecard form:
  scH{n}  = score for hole n
  ptH{n}  = putts for hole n
  fH{n}   = fairway / approach: 1=Left 2=Right 3=Hit 4=Short
  pH{n}   = penalties: S=Greenside Bunker F=Fairway Bunker O=OOB W=Water D=Drop

Course layout from POST /ajax/get_course_data/0/0/0:
  par, yardage, handicap arrays (HTML) + hdcp diff + rating/slope
"""

import os
import re
import time
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

GRINT_USERNAME = os.getenv("GRINT_USERNAME")
GRINT_PASSWORD = os.getenv("GRINT_PASSWORD")

BASE_URL = "https://thegrint.com"
OUTPUT_FILE = Path("/Users/Brayd/Desktop/Data Science Projects/Golf Stats/grint_scraped.xlsx")
REQUEST_TIMEOUT = 30  # seconds

FAIRWAY_MAP = {
    "1": "Left",
    "2": "Right",
    "3": "Hit",
    "4": "Short",
}


# ─── Session / Login ──────────────────────────────────────────────────────────

def create_session():
    s = requests.Session()
    s.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": f"{BASE_URL}/passthru",
        "Origin": BASE_URL,
    })
    return s


def login(session):
    if not GRINT_USERNAME or not GRINT_PASSWORD:
        raise ValueError("Set GRINT_USERNAME and GRINT_PASSWORD in golf_stats/.env")

    print(f"[LOGIN] {GRINT_USERNAME}")
    session.get(f"{BASE_URL}/passthru", timeout=REQUEST_TIMEOUT)  # seed PHPSESSID cookie
    r = session.post(f"{BASE_URL}/login", data={
        "username": GRINT_USERNAME,
        "password": GRINT_PASSWORD,
        "redirect": "passthru",
        "remember": "1",
    }, timeout=REQUEST_TIMEOUT)
    if "dashboard" not in r.url and "score" not in r.url:
        raise RuntimeError(f"Login failed — landed at: {r.url}. Check credentials in .env")
    print(f"  Logged in. Final URL: {r.url}")
    return session


# ─── Rounds List ──────────────────────────────────────────────────────────────

def fetch_initial_page(session, type_score="0"):
    """Fetch initial rounds page, return (html, user_id)."""
    r = session.get(f"{BASE_URL}/score", params={
        "type_score": type_score,
        "handicap_company_id": "3",
    }, timeout=REQUEST_TIMEOUT)
    html = r.text
    # Extract userId from hidden input #filterUserIdScore
    soup = BeautifulSoup(html, "html.parser")
    uid_input = soup.find("input", id="filterUserIdScore")
    user_id = uid_input.get("value", "") if uid_input else ""
    if user_id:
        print(f"  User ID: {user_id}")
    else:
        print("  [WARN] Could not find filterUserIdScore — pagination may be broken")
    return html, user_id


def fetch_more_rounds(session, user_id, wave, total_rows_so_far, type_score="0"):
    """Fetch subsequent waves via listMoreScores."""
    r = session.post(
        f"{BASE_URL}/score/listMoreScores",
        data={
            "wave": wave,
            "wave18": total_rows_so_far,
            "wave9": total_rows_so_far,
            "userId": user_id,
            "courseId": "",
            "typeScore": type_score,
            "handicap_company_id": "3",
        },
        headers={"X-Requested-With": "XMLHttpRequest",
                 "Referer": f"{BASE_URL}/score"},
        timeout=REQUEST_TIMEOUT,
    )
    return r.text


def parse_rounds_html(html):
    """
    Parse round rows into list of round dicts.

    Structure: The page has <tr class='clickable-row'> for each round (summary data)
    and <a class='link-score'> anchors (one per round, in document order) that hold
    the edit_score URL. For wave-1 HTML, some links are outside the TR elements;
    for wave-2+ AJAX responses they're inside. We pair them positionally.

    Skips 'edit_short_score' imported rounds (no full scorecard available).
    """
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.find_all("tr", class_="clickable-row")
    links = soup.find_all("a", class_="link-score")

    rounds = []
    for row, link_a in zip(rows, links):
        href = link_a.get("href", "")

        # Skip imported/short scores — they have no full scorecard
        if "edit_short_score" in href:
            continue

        m = re.search(r"edit_score/(\d+)(?:/(\d+))?", href)
        if not m:
            continue

        round_id = m.group(1)
        url_holes = m.group(2)  # "9" for 9-hole, None for 18

        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        date_raw = cells[0].get_text(strip=True)
        score_raw = cells[2].get_text(strip=True)

        # Parse course cell carefully:
        # Format A (simple): "<td>Davis Park Golf Course<p>Blue 68.90 | 122</p></td>"
        # Format B (sub-course): "<td>Lake Course | Mountain Dell Golf Courses<p>Blue 69.00 | 128</p></td>"
        # Strategy: extract <p> for tee info, then parse main text for course name.
        # When main text has " | ", the segment AFTER the last "|" is the club name.
        td1 = cells[1]
        p_tag = td1.find("p")
        tee_info_text = p_tag.get_text(strip=True) if p_tag else ""
        if p_tag:
            p_tag.extract()  # remove p so get_text gives only main text
        main_text = td1.get_text(strip=True)

        # Strip "(9)" prefix, then split on " | " to find real club name
        main_text = re.sub(r"^\(9\)\s*", "", main_text).strip()
        if " | " in main_text:
            course_name = main_text.rsplit(" | ", 1)[-1].strip()
        else:
            course_name = main_text.strip()
        # Strip UI ellipsis truncation (e.g. "Stonebridge Golf Club ...")
        course_name = re.sub(r"\s*\.\.\.$", "", course_name).strip()

        # Tee: first word of the <p> text (e.g. "Blue 68.90 | 122" → "Blue")
        tee = tee_info_text.split()[0] if tee_info_text else "Blue"

        date = _parse_date(date_raw)

        holes_played = 9 if url_holes == "9" else 18
        try:
            holes_played = int(cells[3].get_text(strip=True)) if len(cells) > 3 else holes_played
        except ValueError:
            pass

        full_url = href if href.startswith("http") else f"{BASE_URL}{href}"

        rounds.append({
            "round_id": round_id,
            "date": date,
            "course_name": course_name,
            "tee": tee,
            "total_score": _safe_int(score_raw),
            "holes_played": holes_played,
            "url": full_url,
        })
    return rounds


def _parse_date(raw):
    """Parse M/D/YY or M/D/YYYY → YYYY-MM-DD."""
    raw = raw.strip()
    try:
        return pd.to_datetime(raw).strftime("%Y-%m-%d")
    except Exception:
        return raw


def _safe_int(val):
    try:
        return int(str(val).strip())
    except Exception:
        return None


def fetch_all_rounds(session):
    """Fetch all rounds across all pagination waves."""
    print("[ROUNDS] Fetching all rounds...")
    all_rounds = []
    seen_ids = set()

    # Wave 1: initial page (also extracts userId)
    html, user_id = fetch_initial_page(session)
    wave_rows = parse_rounds_html(html)
    raw_row_count = len(BeautifulSoup(html, "html.parser").find_all("tr", class_="clickable-row"))

    added = 0
    for r in wave_rows:
        if r["round_id"] not in seen_ids:
            seen_ids.add(r["round_id"])
            all_rounds.append(r)
            added += 1
    print(f"  Wave 1: +{added} rounds (total {len(all_rounds)})")

    # Waves 2+: use total raw row count (including skipped rows) as wave18/wave9 cursor
    total_rows_displayed = raw_row_count
    wave = 2

    while True:
        html = fetch_more_rounds(session, user_id, wave, total_rows_displayed)
        if not html or not html.strip():
            break

        soup = BeautifulSoup(html, "html.parser")
        new_raw_rows = len(soup.find_all("tr", class_="clickable-row"))
        if new_raw_rows == 0:
            break

        new_rounds = parse_rounds_html(html)
        added = 0
        for r in new_rounds:
            if r["round_id"] not in seen_ids:
                seen_ids.add(r["round_id"])
                all_rounds.append(r)
                added += 1

        total_rows_displayed += new_raw_rows
        print(f"  Wave {wave}: +{added} rounds (total {len(all_rounds)})")

        if added == 0:
            break  # no new rounds → pagination complete

        wave += 1
        time.sleep(0.5)

    print(f"  Total rounds: {len(all_rounds)}")
    return all_rounds


# ─── Round Detail ─────────────────────────────────────────────────────────────

def fetch_round_detail(session, round_info):
    """
    GET the round's edit_score page (as XHR) and parse hole inputs.
    Returns dict with course_id, user_id, tee, handicap_differential,
    and per-hole data (scores, putts, fairway, penalties).
    """
    url = round_info["url"]
    r = session.get(url, headers={
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/score?type_score=0&handicap_company_id=3",
    }, timeout=REQUEST_TIMEOUT)

    if r.status_code != 200:
        print(f"    [WARN] {url} → {r.status_code}")
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    form = soup.find("form", id="scorecard-form")
    if not form:
        print(f"    [WARN] No scorecard-form found at {url}")
        return None

    # Extract all named form inputs
    inputs = {}
    for inp in form.find_all("input"):
        name = inp.get("name", "")
        val = inp.get("value", "")
        if name:
            inputs[name] = val

    course_id = inputs.get("course", "")
    user_id = inputs.get("userid1", "")
    hc_diff = inputs.get("handicap_ghap", "")
    holes_count = _safe_int(inputs.get("round", 18)) or 18

    # Determine score type for course data call
    round_type = str(holes_count)

    # Build per-hole data dicts
    holes = []
    for n in range(1, holes_count + 1):
        score = _safe_int(inputs.get(f"scH{n}"))
        putts = _safe_int(inputs.get(f"ptH{n}"))
        fairway_code = str(inputs.get(f"fH{n}", "")).strip()
        penalty_code = str(inputs.get(f"pH{n}", "")).strip()

        fairway_hit = FAIRWAY_MAP.get(fairway_code)
        penalties, bunker_type = _parse_penalties(penalty_code)

        holes.append({
            "hole_number": n,
            "score": score,
            "putts": putts,
            "_fairway_code": fairway_code,
            "_penalty_code": penalty_code,
            "fairway_hit_raw": fairway_hit,
            "penalties": penalties,
            "bunker_type": bunker_type,
        })

    return {
        "course_id": course_id,
        "user_id": user_id,
        "tee": round_info.get("tee", ""),
        "handicap_differential": _safe_float(hc_diff),
        "holes_count": holes_count,
        "holes": holes,
    }


def _parse_penalties(code):
    """
    pH{n} values: S=Greenside Bunker, F=Fairway Bunker,
                  O=OOB, W=Water/Penalty, D=Drop, empty=none.
    Multiple chars = multiple penalties (e.g. 'SS' = 2 greenside bunker shots).
    Returns (penalty_count, bunker_type).
    """
    if not code:
        return 0, None
    count = len(code)
    first = code[0].upper()
    bunker = None
    if first == "S":
        bunker = "Greenside Bunker"
    elif first == "F":
        bunker = "Fairway Bunker"
    return count, bunker


def _safe_float(val):
    try:
        return float(str(val).strip())
    except Exception:
        return None


# ─── Course Layout ────────────────────────────────────────────────────────────

def fetch_course_data(session, course_id, tee, user_id, round_type, score_id):
    """
    POST /ajax/get_course_data/0/0/0 → par, yardage, handicap arrays.
    """
    r = session.post(
        f"{BASE_URL}/ajax/get_course_data/0/0/0",
        data={
            "course_id": course_id,
            "tee": tee,
            "user_id": user_id,
            "round": round_type,
            "score_id": score_id,
            "handicap_company_id": "3",
        },
        headers={"X-Requested-With": "XMLHttpRequest",
                 "Referer": f"{BASE_URL}/score"},
        timeout=REQUEST_TIMEOUT,
    )
    if r.status_code != 200:
        return None
    try:
        data = r.json()
    except Exception:
        return None

    def parse_html_values(html):
        if not html or not isinstance(html, str):
            return []
        soup = BeautifulSoup(html, "html.parser")
        return [td.get_text(strip=True)
                for td in soup.find_all("td", class_=re.compile(r"data-entry"))]

    pars = parse_html_values(data.get("par", ""))
    yardages = parse_html_values(data.get("yardage", ""))
    handicaps = parse_html_values(data.get("handicap", ""))

    return {
        "pars": [_safe_int(v) for v in pars],
        "yardages": [_safe_int(v) for v in yardages],
        "handicaps": [_safe_int(v) for v in handicaps],
        "course_par": data.get("coursePar"),
        "rating": data.get("rating"),
        "slope": data.get("slope"),
        "hdcp": data.get("hdcp"),
    }


# ─── Build Row ────────────────────────────────────────────────────────────────

def build_hole_rows(round_info, detail, course_layout):
    """Merge round + detail + course layout into per-hole output rows."""
    rows = []
    holes = detail["holes"]
    pars = course_layout.get("pars", []) if course_layout else []
    yardages = course_layout.get("yardages", []) if course_layout else []
    handicaps = course_layout.get("handicaps", []) if course_layout else []
    hc_diff = course_layout.get("hdcp") if course_layout else detail.get("handicap_differential")

    for h in holes:
        n = h["hole_number"]
        idx = n - 1
        par = pars[idx] if idx < len(pars) else None
        yardage = yardages[idx] if idx < len(yardages) else None
        handicap_rating = handicaps[idx] if idx < len(handicaps) else None

        score = h["score"]
        putts = h["putts"]
        fairway_raw = h["fairway_hit_raw"]  # Hit/Left/Right/Short/None

        # Green status:
        # For par 3: fairway field = approach accuracy → maps to green_status
        # For par 4/5: compute GIR from score-putts
        if par == 3:
            green_status = fairway_raw   # Hit/Left/Right/Short
            fairway_hit = None           # no fairway on par 3
        else:
            fairway_hit = fairway_raw    # Hit/Left/Right/Short
            # Compute GIR: reached green in par-2 strokes or fewer
            if score is not None and putts is not None and par is not None:
                gir = (score - putts) <= (par - 2)
                green_status = "Hit" if gir else "Unknown"
            else:
                green_status = None

        score_relative = (score - par) if (score and par) else None

        rows.append({
            "Date": round_info["date"],
            "Course Name": round_info["course_name"],
            "Tee": detail.get("tee", ""),
            "Hole": n,
            "Par": par,
            "Yardage": yardage,
            "Handicap": handicap_rating,
            "Score": score,
            "Score Relative": score_relative,
            "Putts": putts,
            "Fairway Hit": fairway_hit,
            "Green Status": green_status,
            "Penalties": h["penalties"],
            "Bunker Type": h["bunker_type"],
            "Handicap Differential": hc_diff,
            "Total Score": round_info.get("total_score"),
            "Holes Played": round_info.get("holes_played"),
            "Round ID": round_info["round_id"],
        })
    return rows


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n=== The Grint Scraper ===\n")

    session = create_session()
    login(session)

    rounds = fetch_all_rounds(session)
    if not rounds:
        print("[ERROR] No rounds found.")
        return

    all_rows = []
    course_cache = {}  # (course_id, tee, round_type) → course_layout

    for i, rnd in enumerate(rounds):
        print(f"[{i+1}/{len(rounds)}] {rnd['date']} — {rnd['course_name']} ({rnd['holes_played']}h)")

        detail = fetch_round_detail(session, rnd)
        if not detail:
            print("  Skipped (no detail)")
            continue

        course_id = detail["course_id"]
        tee = detail["tee"]
        round_type = str(detail["holes_count"])
        cache_key = (course_id, tee, round_type)

        if cache_key not in course_cache:
            layout = fetch_course_data(
                session, course_id, tee,
                detail["user_id"], round_type, rnd["round_id"]
            )
            course_cache[cache_key] = layout
            if layout:
                print(f"  Course: par={layout['pars']} rating={layout.get('rating')} slope={layout.get('slope')}")
        course_layout = course_cache.get(cache_key)

        rows = build_hole_rows(rnd, detail, course_layout)
        all_rows.extend(rows)
        print(f"  {len(rows)} holes → total {len(all_rows)}")

        time.sleep(0.3)  # be polite

    if not all_rows:
        print("[ERROR] No hole data collected.")
        return

    df = pd.DataFrame(all_rows)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(OUTPUT_FILE, index=False)
    print(f"\n[DONE] {len(df)} hole rows saved to {OUTPUT_FILE}")
    print(f"  Rounds: {df['Round ID'].nunique()}")
    print(f"  Date range: {df['Date'].min()} → {df['Date'].max()}")
    print(f"\nNext step: python3 golf_stats/data_pipeline.py")


if __name__ == "__main__":
    main()
