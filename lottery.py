"""
Number Oracle — Lottery Results Bot
Scrapes Australian lottery results and saves to results.json.
Runs daily via GitHub Actions at 11pm AEST.

Data sources:
  Primary: lottonumbers.com.au (static HTML, all games on homepage)
  Backup:  oz-lotteries.com (Super 66), australia.national-lottery.com (Set for Life)

IMPORTANT: au.lottonumbers.com and australia.national-lottery.com render draw
numbers via JavaScript — requests+BeautifulSoup cannot see them. Only
lottonumbers.com.au serves results in static HTML.
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime

RESULTS_FILE = "results.json"

# Game rules for validation
GAMES = {
    "powerball":   {"label": "Powerball",        "count": 7, "max": 35, "bonus": True,  "bonus_max": 20},
    "ozlotto":     {"label": "Oz Lotto",         "count": 7, "max": 47, "bonus": False},
    "saturday":    {"label": "Saturday Lotto",    "count": 6, "max": 45, "bonus": False},
    "weekday":     {"label": "Weekday Windfall",  "count": 6, "max": 45, "bonus": False},
    "setforlife":  {"label": "Set for Life",      "count": 7, "max": 44, "bonus": False},
    "super66":     {"label": "Super 66",          "count": 6, "max": 9,  "bonus": False, "digit": True},
}

# Which games run on which days
DAY_TO_GAMES = {
    "Monday":    ["weekday", "setforlife"],
    "Tuesday":   ["ozlotto", "setforlife"],
    "Wednesday": ["weekday", "setforlife"],
    "Thursday":  ["powerball", "setforlife"],
    "Friday":    ["weekday", "setforlife"],
    "Saturday":  ["saturday", "setforlife", "super66"],
    "Sunday":    ["setforlife"],
}

# Keywords to match each game in the lottonumbers.com.au HTML table
GAME_KEYWORDS = {
    "powerball":  "Powerball",
    "ozlotto":    "Oz Lotto",
    "saturday":   "Saturday Lotto",
    "weekday":    "Windfall",
    "setforlife": "Set for Life",  # Not on lottonumbers.com.au — use backup
    "super66":    "Super 66",      # Not on lottonumbers.com.au — use backup
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}


def load_results():
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {key: [] for key in GAMES.keys()}


def save_results(results):
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)


def parse_date(date_str):
    """Parse DD/MM/YYYY or 'Day DD Month YYYY' into YYYY-MM-DD"""
    if not date_str:
        return None
    date_str = date_str.strip()
    
    # Try DD/MM/YYYY first (lottonumbers.com.au format)
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", date_str)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    
    # Try "Day DD Month YYYY"
    cleaned = re.sub(r"^[A-Za-z]+,?\s*", "", date_str)
    for fmt in ["%d %B %Y", "%d %b %Y", "%B %d, %Y"]:
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def validate_draw(game_key, numbers, bonus=None):
    """Validate numbers against game rules. Returns True if valid."""
    rules = GAMES[game_key]
    
    if len(numbers) != rules["count"]:
        print(f"  ❌ Wrong count: got {len(numbers)}, need {rules['count']}")
        return False
    
    is_digit = rules.get("digit", False)
    
    for n in numbers:
        if is_digit:
            if n < 0 or n > rules["max"]:
                print(f"  ❌ Digit {n} out of range 0-{rules['max']}")
                return False
        else:
            if n < 1 or n > rules["max"]:
                print(f"  ❌ Number {n} out of range 1-{rules['max']}")
                return False
    
    # Check duplicates (except for digit games like Super 66)
    if not is_digit and len(set(numbers)) != len(numbers):
        print(f"  ❌ Duplicate numbers: {numbers}")
        return False
    
    if bonus is not None and rules.get("bonus"):
        if bonus < 1 or bonus > rules["bonus_max"]:
            print(f"  ❌ Bonus {bonus} out of range 1-{rules['bonus_max']}")
            return False
    
    return True


def scrape_lottonumbers_au():
    """
    Scrape lottonumbers.com.au homepage for all main game results.
    Returns dict: { game_key: { date, numbers, bonus? } }
    
    The page has a table with rows like:
      Saturday Lotto | 04/04/2026 | 2 | 4 | 13 | 5 | 14 | 37 | 21 | 22 | ...
      Powerball      | 02/04/2026 | 23| 27| 20 | 35| 34 | 30 | 32 | 18 | ...
    """
    url = "https://www.lottonumbers.com.au/"
    print(f"  Fetching {url}")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code != 200:
            print(f"  ❌ HTTP {resp.status_code}")
            return {}
        
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        
        results = {}
        
        for game_key, keyword in GAME_KEYWORDS.items():
            if game_key in ("setforlife", "super66"):
                continue  # These aren't on lottonumbers.com.au
            
            rules = GAMES[game_key]
            
            # Find the game row: "keyword · DD/MM/YYYY · N1 · N2 · ..."
            # The format on the page is: GameName DD/MM/YYYY N N N N N N [N N] ...
            pattern = rf"{keyword}\s+(\d{{2}}/\d{{2}}/\d{{4}})\s+([\d\s·]+?)(?:Full Result|Next Draw)"
            match = re.search(pattern, text)
            
            if not match:
                # Try alternate pattern without "Full Result"
                pattern = rf"{keyword}\s+(\d{{2}}/\d{{2}}/\d{{4}})\s+((?:\d+[\s·]+){{6,12}})"
                match = re.search(pattern, text)
            
            if not match:
                print(f"  ⚠️ Could not find {keyword} in page")
                continue
            
            date_str = match.group(1)
            nums_str = match.group(2)
            
            iso_date = parse_date(date_str)
            if not iso_date:
                print(f"  ⚠️ Could not parse date: {date_str}")
                continue
            
            # Extract all numbers from the matched section
            raw_nums = re.findall(r"\d+", nums_str)
            all_nums = [int(n) for n in raw_nums]
            
            # Split into main numbers and supplementary/bonus
            main_count = rules["count"]
            if len(all_nums) < main_count:
                print(f"  ⚠️ Only {len(all_nums)} numbers for {keyword}")
                continue
            
            main_nums = all_nums[:main_count]
            
            # For Powerball, the 8th number is the Powerball
            bonus = None
            if rules.get("bonus") and len(all_nums) > main_count:
                bonus = all_nums[main_count]
            
            # Sort main numbers (lottonumbers.com.au shows them unsorted)
            main_nums_sorted = sorted(main_nums)
            
            # Validate
            if not validate_draw(game_key, main_nums_sorted, bonus):
                print(f"  ❌ Validation failed for {keyword}")
                continue
            
            draw_data = {"date": iso_date, "numbers": main_nums_sorted}
            if bonus is not None:
                draw_data["bonus"] = bonus
            
            results[game_key] = draw_data
            print(f"  ✅ {keyword}: {iso_date} → {main_nums_sorted}" + (f" + PB:{bonus}" if bonus else ""))
        
        return results
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return {}


def scrape_set_for_life():
    """
    Scrape Set for Life from australia.national-lottery.com search results.
    The main page loads JS but Google-indexed search snippets have the data.
    Fallback: use the /results page which sometimes has numbers in HTML.
    """
    url = "https://australia.national-lottery.com/set-for-life/results"
    print(f"  Fetching Set for Life from {url}")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code != 200:
            print(f"  ❌ HTTP {resp.status_code}")
            return None
        
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        
        # Look for: "Draw XXXX - DayName DD Month YYYY · N · N · N · N · N · N · N · N · N"
        match = re.search(
            r"Draw\s+(\d+)\s*-\s*\w+\s+(\d{1,2}\s+\w+\s+\d{4})\s*·\s*((?:\d+\s*·?\s*){7,9})",
            text
        )
        
        if not match:
            print(f"  ⚠️ Could not find Set for Life draw")
            return None
        
        draw_no = match.group(1)
        date_str = match.group(2)
        nums_str = match.group(3)
        
        iso_date = parse_date(date_str)
        if not iso_date:
            return None
        
        raw_nums = re.findall(r"\d+", nums_str)
        all_nums = [int(n) for n in raw_nums]
        
        if len(all_nums) < 7:
            print(f"  ⚠️ Only {len(all_nums)} numbers")
            return None
        
        main_nums = sorted(all_nums[:7])
        
        if not validate_draw("setforlife", main_nums):
            return None
        
        print(f"  ✅ Set for Life Draw {draw_no}: {iso_date} → {main_nums}")
        return {"date": iso_date, "numbers": main_nums}
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None


def scrape_super66():
    """Scrape Super 66 from oz-lotteries.com (static HTML)."""
    url = "https://www.oz-lotteries.com/results/super-66-results/index.php"
    print(f"  Fetching Super 66 from {url}")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code != 200:
            print(f"  ❌ HTTP {resp.status_code}")
            return None
        
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        
        # Find: "Saturday, DD Mon YYYY" followed by "Winning Numbers: D D D D D D"
        # or "Latest Super 66 Lotto Results XXXX: Saturday, DD Mon YYYY Winning Numbers: D D D D D D"
        match = re.search(
            r"(?:Saturday|Sat),?\s+(\d{1,2}\s+\w+\s+\d{4})\s+.*?(?:Winning Numbers|Numbers)[:\s]+([\d\s]+?)(?:Next|Divid|Buy)",
            text
        )
        
        if not match:
            # Try simpler pattern
            match = re.search(r"(\d{1,2}\s+\w+\s+\d{4})\s+.*?(\d\s+\d\s+\d\s+\d\s+\d\s+\d)", text)
        
        if not match:
            print(f"  ⚠️ Could not find Super 66 draw")
            return None
        
        date_str = match.group(1)
        nums_str = match.group(2)
        
        iso_date = parse_date(date_str)
        if not iso_date:
            return None
        
        raw_nums = re.findall(r"\d", nums_str)
        digits = [int(d) for d in raw_nums[:6]]
        
        if len(digits) != 6:
            print(f"  ⚠️ Only {len(digits)} digits")
            return None
        
        if not validate_draw("super66", digits):
            return None
        
        print(f"  ✅ Super 66: {iso_date} → {digits}")
        return {"date": iso_date, "numbers": digits}
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None


def format_telegram(game_key, draw_data):
    label = GAMES[game_key]["label"]
    nums = " ".join(str(n) for n in draw_data["numbers"])
    msg = f"🎯 {label}\n📅 {draw_data['date']}\n🔢 {nums}"
    if "bonus" in draw_data:
        msg += f"\n⚡ Powerball: {draw_data['bonus']}"
    return msg


def send_telegram(message):
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("CHAT_ID")
    if not token or not chat_id:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message},
            timeout=30
        )
    except Exception as e:
        print(f"  ⚠️ Telegram: {e}")


def main():
    print("🚀 Number Oracle Bot")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    
    today = datetime.now().strftime("%A")
    print(f"   Today: {today}")
    
    games_today = DAY_TO_GAMES.get(today, [])
    print(f"   Games: {', '.join(GAMES[g]['label'] for g in games_today)}\n")
    
    all_results = load_results()
    
    # Load state for dedup
    state_file = "lottery_state.json"
    state = {}
    if os.path.exists(state_file):
        with open(state_file, "r", encoding="utf-8") as f:
            state = json.load(f)
    
    updated = False
    
    # Step 1: Scrape main games from lottonumbers.com.au
    print("📡 Scraping lottonumbers.com.au...")
    main_results = scrape_lottonumbers_au()
    
    # Step 2: Scrape Set for Life (daily game, separate source)
    if "setforlife" in games_today:
        print("\n📡 Scraping Set for Life...")
        sfl = scrape_set_for_life()
        if sfl:
            main_results["setforlife"] = sfl
    
    # Step 3: Scrape Super 66 (Saturday only, separate source)
    if "super66" in games_today:
        print("\n📡 Scraping Super 66...")
        s66 = scrape_super66()
        if s66:
            main_results["super66"] = s66
    
    # Step 4: Save new results
    print("\n💾 Processing results...")
    for game_key in games_today:
        if game_key not in main_results:
            print(f"  ⚠️ No data for {GAMES[game_key]['label']}")
            continue
        
        draw_data = main_results[game_key]
        unique_key = f"{draw_data['date']}|{draw_data['numbers']}"
        
        # Check if new
        if state.get(game_key) == unique_key:
            print(f"  ℹ️ {GAMES[game_key]['label']}: no change")
            continue
        
        # Check if date already exists
        existing_dates = {d["date"] for d in all_results.get(game_key, [])}
        if draw_data["date"] in existing_dates:
            print(f"  ℹ️ {GAMES[game_key]['label']}: {draw_data['date']} already saved")
            state[game_key] = unique_key
            continue
        
        # Save
        if game_key not in all_results:
            all_results[game_key] = []
        all_results[game_key].append(draw_data)
        all_results[game_key].sort(key=lambda x: x["date"])
        
        state[game_key] = unique_key
        updated = True
        
        print(f"  💾 {GAMES[game_key]['label']}: saved {draw_data['date']}")
        send_telegram(format_telegram(game_key, draw_data))
    
    # Save state
    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    
    # Save results
    if updated:
        save_results(all_results)
        print(f"\n✅ results.json updated!")
    else:
        print(f"\nℹ️ No new results to save")
    
    print("✅ Done")


if __name__ == "__main__":
    main()
