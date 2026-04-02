import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime

RESULTS_FILE = "results.json"

GAME_URLS = {
    "Weekday Windfall": "https://au.lottonumbers.com/weekday-windfall/results",
    "Oz Lotto": "https://au.lottonumbers.com/oz-lotto/results",
    "Powerball": "https://au.lottonumbers.com/powerball/results",
    "Saturday Lotto": "https://au.lottonumbers.com/saturday-lotto/results",
    "Set for Life": "https://au.lottonumbers.com/set-for-life/results",
}

BACKUP_URLS = {
    "Weekday Windfall": "https://australia.national-lottery.com/weekday-windfall/results",
    "Oz Lotto": "https://australia.national-lottery.com/oz-lotto/results",
    "Powerball": "https://australia.national-lottery.com/powerball/results",
    "Saturday Lotto": "https://australia.national-lottery.com/saturday-lotto/results",
    "Set for Life": "https://australia.national-lottery.com/set-for-life/results",
}

GAME_KEY_MAP = {
    "Powerball": "powerball",
    "Oz Lotto": "ozlotto",
    "Saturday Lotto": "saturday",
    "Weekday Windfall": "weekday",
    "Set for Life": "setforlife",
}

GAME_RULES = {
    "Powerball":        {"count": 7, "max": 35, "bonus_max": 20},
    "Oz Lotto":         {"count": 7, "max": 47, "bonus_max": 0},
    "Saturday Lotto":   {"count": 6, "max": 45, "bonus_max": 0},
    "Weekday Windfall": {"count": 6, "max": 45, "bonus_max": 0},
    "Set for Life":     {"count": 7, "max": 44, "bonus_max": 0},
}

DAY_TO_GAMES = {
    "Monday":    ["Weekday Windfall", "Set for Life"],
    "Tuesday":   ["Oz Lotto", "Set for Life"],
    "Wednesday": ["Weekday Windfall", "Set for Life"],
    "Thursday":  ["Powerball", "Set for Life"],
    "Friday":    ["Weekday Windfall", "Set for Life"],
    "Saturday":  ["Saturday Lotto", "Set for Life"],
    "Sunday":    ["Set for Life"],
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}


def load_results():
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {key: [] for key in GAME_KEY_MAP.values()}


def save_results(results):
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)


def parse_draw_date(date_str):
    """Parse date string into YYYY-MM-DD format"""
    if not date_str:
        return None
    cleaned = re.sub(r"^[A-Za-z]+,?\s*", "", date_str.strip())
    for fmt in ["%d %B %Y", "%d %b %Y", "%d/%m/%Y", "%B %d, %Y"]:
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_page(game, html, url):
    """
    Parse the latest draw result from au.lottonumbers.com or australia.national-lottery.com.
    
    Strategy: Find the first draw result block on the page by looking for
    the draw number pattern, then extract numbers from that specific section only.
    """
    soup = BeautifulSoup(html, "html.parser")
    rules = GAME_RULES[game]
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)

    # ── Step 1: Find draw number ──
    # au.lottonumbers.com: "Draw 4,683" or "Draw 1,558"
    # national-lottery.com: "Draw 4683" or "Draw 1558"
    draw_match = re.search(r"Draw\s+([\d,]+)", text)
    draw_no = draw_match.group(1).replace(",", "") if draw_match else None

    if not draw_no:
        print(f"  ⚠️ Could not find draw number")
        return None

    # ── Step 2: Find draw date ──
    # Look for "Day DD Month YYYY" pattern near the draw number
    date_match = re.search(
        r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\s+\w+\s+\d{4})",
        text
    )
    if not date_match:
        # Try "DD Month YYYY" without day name
        date_match = re.search(r"(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})", text)
    
    draw_date_str = date_match.group(0) if date_match else None
    iso_date = parse_draw_date(draw_date_str)

    if not iso_date:
        print(f"  ⚠️ Could not parse date")
        return None

    # ── Step 3: Extract numbers from the FIRST result block only ──
    # We need to isolate just the first draw's numbers, not the whole page.
    #
    # au.lottonumbers.com structure:
    #   Each draw is in a table row with <li> elements for balls
    #   The first draw block appears before any "Draw X,XXX" for older draws
    #
    # Strategy: Find text between first "Draw XXXX Date" and next "Draw XXXX" or "Prizes"
    
    # Find the position of the first draw info
    first_draw_pos = text.find(f"Draw {draw_match.group(1)}")
    if first_draw_pos == -1:
        first_draw_pos = 0
    
    # Find where the next draw starts (or end markers)
    remaining = text[first_draw_pos + len(draw_match.group(0)):]
    
    # Look for the next "Draw X,XXX" which marks a different draw
    next_draw = re.search(r"Draw\s+[\d,]+\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)", remaining)
    if next_draw:
        section = remaining[:next_draw.start()]
    else:
        # Take a limited chunk (first 500 chars after draw info)
        section = remaining[:500]
    
    # Extract all 1-2 digit numbers from this section
    raw_nums = re.findall(r"\b(\d{1,2})\b", section)
    all_nums = [int(n) for n in raw_nums]
    
    # Filter to only valid range numbers
    valid_nums = [n for n in all_nums if 1 <= n <= rules["max"]]
    
    if len(valid_nums) < rules["count"]:
        print(f"  ⚠️ Only found {len(valid_nums)} valid numbers, need {rules['count']}")
        return None
    
    # Take the first N numbers as main numbers
    main_nums = valid_nums[:rules["count"]]
    
    # Check for duplicates
    if len(set(main_nums)) != len(main_nums):
        print(f"  ⚠️ Duplicate numbers: {main_nums}")
        return None
    
    # Extract bonus (Powerball only)
    bonus = None
    if rules["bonus_max"] > 0 and len(valid_nums) > rules["count"]:
        potential_bonus = valid_nums[rules["count"]]
        if 1 <= potential_bonus <= rules["bonus_max"]:
            bonus = potential_bonus
    
    # Sort main numbers
    main_nums_sorted = sorted(main_nums)
    
    # Build result
    draw_data = {"date": iso_date, "numbers": main_nums_sorted}
    if bonus is not None:
        draw_data["bonus"] = bonus
    
    unique_key = f"{draw_no}|{iso_date}|{'-'.join(str(n) for n in main_nums_sorted)}"
    
    print(f"  ✅ Draw {draw_no} | {iso_date} | {main_nums_sorted}" + (f" + PB:{bonus}" if bonus else ""))
    
    return {
        "game": game,
        "draw_no": draw_no,
        "draw_date": draw_date_str or iso_date,
        "draw_data": draw_data,
        "numbers": [str(n) for n in main_nums_sorted],
        "unique_key": unique_key,
        "url": url,
    }


def fetch_and_parse(game, url):
    """Fetch URL and parse the result with error handling"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code == 403:
            print(f"  ⚠️ 403 blocked: {url}")
            return None
        resp.raise_for_status()
        return parse_page(game, resp.text, url)
    except Exception as e:
        print(f"  ⚠️ Error: {e}")
        return None


def format_message(result):
    data = result["draw_data"]
    nums = " ".join(str(n) for n in data["numbers"])
    msg = f"🎯 {result['game']} Result\n\nDraw: {result['draw_no']}\nDate: {result['draw_date']}\nNumbers: {nums}"
    if "bonus" in data:
        msg += f"\nPowerball: {data['bonus']}"
    return msg


def send_telegram(message):
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("CHAT_ID")
    if not token or not chat_id:
        print("  ⚠️ Telegram not configured")
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message},
            timeout=30
        ).raise_for_status()
    except Exception as e:
        print(f"  ⚠️ Telegram failed: {e}")


def main():
    print("🚀 Lottery Bot started")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    all_results = load_results()

    state_file = "lottery_state.json"
    state = {}
    if os.path.exists(state_file):
        with open(state_file, "r", encoding="utf-8") as f:
            state = json.load(f)

    today = datetime.now().strftime("%A")
    print(f"   Today: {today}\n")

    games = DAY_TO_GAMES.get(today, [])
    updated = False

    for game in games:
        print(f"📋 {game}:")

        result = fetch_and_parse(game, GAME_URLS[game])

        if result is None and game in BACKUP_URLS:
            print(f"  Trying backup...")
            result = fetch_and_parse(game, BACKUP_URLS[game])

        if result is None:
            print(f"  ❌ Failed\n")
            continue

        if state.get(game) != result["unique_key"]:
            send_telegram(format_message(result))

            game_key = GAME_KEY_MAP[game]
            existing_dates = {d["date"] for d in all_results.get(game_key, [])}

            if result["draw_data"]["date"] not in existing_dates:
                if game_key not in all_results:
                    all_results[game_key] = []
                all_results[game_key].append(result["draw_data"])
                all_results[game_key].sort(key=lambda x: x["date"])
                updated = True
                print(f"  💾 Saved to results.json")
            else:
                print(f"  ℹ️ Already exists")

            state[game] = result["unique_key"]
        else:
            print(f"  ℹ️ No change")
        print()

    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    if updated:
        save_results(all_results)
        print("💾 results.json updated!")
    else:
        print("ℹ️ No new results")

    print("✅ Done")


if __name__ == "__main__":
    main()
