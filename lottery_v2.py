#!/usr/bin/env python3
"""
Number Oracle — Australian Lottery Scraper v2
Scrapes latest results from lottonumbers.com.au
Runs via GitHub Actions nightly at 11pm AEST
Outputs results.json — frontend fetches this from raw.githubusercontent.com
"""

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
}

GAMES = {
    "powerball": {
        "name": "Powerball",
        "url": "https://au.lottonumbers.com/powerball/past-results",
        "archive_url": "https://au.lottonumbers.com/powerball/results/{year}-archive",
        "mainCount": 7, "mainMax": 35, "bonusMax": 20, "digitGame": False,
    },
    "ozlotto": {
        "name": "Oz Lotto",
        "url": "https://au.lottonumbers.com/oz-lotto/past-results",
        "archive_url": "https://au.lottonumbers.com/oz-lotto/results/{year}-archive",
        "mainCount": 7, "mainMax": 47, "bonusMax": 0, "digitGame": False,
    },
    "saturday": {
        "name": "Saturday Lotto",
        "url": "https://au.lottonumbers.com/saturday-lotto/past-results",
        "archive_url": "https://au.lottonumbers.com/saturday-lotto/results/{year}-archive",
        "mainCount": 6, "mainMax": 45, "bonusMax": 0, "digitGame": False,
    },
    "weekday": {
        "name": "Weekday Windfall",
        "url": "https://au.lottonumbers.com/weekday-windfall/past-results",
        "archive_url": "https://au.lottonumbers.com/weekday-windfall/results/{year}-archive",
        "mainCount": 6, "mainMax": 45, "bonusMax": 0, "digitGame": False,
    },
    "setforlife": {
        "name": "Set for Life",
        "url": "https://au.lottonumbers.com/set-for-life/past-results",
        "archive_url": "https://au.lottonumbers.com/set-for-life/results/{year}-archive",
        "mainCount": 7, "mainMax": 44, "bonusMax": 0, "digitGame": False,
    },
    "super66": {
        "name": "Super 66",
        "url": "https://au.lottonumbers.com/super66/past-results",
        "archive_url": "https://au.lottonumbers.com/super66/results/{year}-archive",
        "mainCount": 6, "mainMax": 9, "bonusMax": 0, "digitGame": True,
    },
}

MONTHS = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
}


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def fetch_page(url, retries=3):
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 200:
                return resp.text
            log(f"  HTTP {resp.status_code} for {url} (attempt {attempt+1})")
        except Exception as e:
            log(f"  Error: {e} (attempt {attempt+1})")
        if attempt < retries - 1:
            time.sleep(2 * (attempt + 1))
    return None


def parse_page(html, game_key):
    """Parse draw results from au.lottonumbers.com table pages."""
    cfg = GAMES[game_key]
    soup = BeautifulSoup(html, "html.parser")
    draws = []

    # The site uses tables with rows containing draw info
    for row in soup.select("table tr"):
        text = row.get_text(" ", strip=True)

        # Find date pattern: "DD Month YYYY"
        date_match = re.search(
            r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})",
            text
        )
        if not date_match:
            continue

        day = int(date_match.group(1))
        month = MONTHS[date_match.group(2)]
        year = int(date_match.group(3))
        date_str = f"{year}-{month:02d}-{day:02d}"

        # Extract numbers from <li> elements in this row
        nums = []
        for li in row.select("li"):
            t = li.get_text(strip=True)
            if t.isdigit():
                nums.append(int(t))

        if len(nums) < cfg["mainCount"]:
            continue

        main = nums[:cfg["mainCount"]]
        lo = 0 if cfg["digitGame"] else 1

        # Validate range
        if not all(lo <= n <= cfg["mainMax"] for n in main):
            continue

        draw = {"date": date_str, "numbers": main if cfg["digitGame"] else sorted(main)}

        # Powerball bonus
        if cfg["bonusMax"] > 0 and len(nums) > cfg["mainCount"]:
            pb = nums[cfg["mainCount"]]
            if 1 <= pb <= cfg["bonusMax"]:
                draw["bonus"] = pb

        draws.append(draw)

    return draws


def scrape_game(game_key):
    """Scrape a game's past results + current year archive."""
    cfg = GAMES[game_key]
    log(f"Scraping {cfg['name']}...")
    all_draws = []

    # 1. Past results page (last ~6 months)
    html = fetch_page(cfg["url"])
    if html:
        d = parse_page(html, game_key)
        log(f"  Past results: {len(d)} draws")
        all_draws.extend(d)
    else:
        log(f"  FAILED to fetch past results page")

    time.sleep(1)

    # 2. Current year archive
    year = datetime.now().year
    html = fetch_page(cfg["archive_url"].format(year=year))
    if html:
        d = parse_page(html, game_key)
        log(f"  Archive {year}: {len(d)} draws")
        all_draws.extend(d)

    time.sleep(1)

    # 3. Previous year archive
    html = fetch_page(cfg["archive_url"].format(year=year - 1))
    if html:
        d = parse_page(html, game_key)
        log(f"  Archive {year-1}: {len(d)} draws")
        all_draws.extend(d)

    # Deduplicate
    seen = set()
    unique = []
    for draw in all_draws:
        if draw["date"] not in seen:
            seen.add(draw["date"])
            unique.append(draw)
    unique.sort(key=lambda x: x["date"])

    log(f"  TOTAL: {len(unique)} unique draws")
    return unique


def main():
    log("=" * 50)
    log("Number Oracle Scraper v2")
    log("=" * 50)

    results_file = Path(__file__).parent / "results.json"

    # Load existing
    existing = {}
    if results_file.exists():
        try:
            existing = json.loads(results_file.read_text())
        except Exception:
            existing = {}

    total_new = 0
    summary = []

    for game_key in GAMES:
        try:
            scraped = scrape_game(game_key)

            # Merge with existing
            old_dates = {d["date"] for d in existing.get(game_key, [])}
            merged = list(existing.get(game_key, []))
            added = 0
            for draw in scraped:
                if draw["date"] not in old_dates:
                    merged.append(draw)
                    old_dates.add(draw["date"])
                    added += 1
            merged.sort(key=lambda x: x["date"])
            existing[game_key] = merged
            total_new += added
            summary.append(f"  {GAMES[game_key]['name']}: {len(merged)} draws (+{added} new)")
        except Exception as e:
            log(f"  ERROR: {GAMES[game_key]['name']}: {e}")
            summary.append(f"  {GAMES[game_key]['name']}: ERROR")

        time.sleep(2)  # Be polite to the server

    # Save
    results_file.write_text(json.dumps(existing, indent=2))

    log("")
    log("RESULTS:")
    for s in summary:
        log(s)
    log(f"\nNew draws: {total_new}")
    log(f"File: {results_file} ({results_file.stat().st_size / 1024:.1f} KB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
