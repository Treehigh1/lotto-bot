import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime

RESULTS_FILE = "results.json"

GAME_URLS = {
    "Weekday Windfall": "https://www.thelott.com/weekday-windfall/results",
    "Oz Lotto": "https://www.thelott.com/oz-lotto/results",
    "Powerball": "https://www.thelott.com/powerball/results",
    "Saturday Lotto": "https://www.thelott.com/saturday-lotto/results",
    "Set for Life": "https://www.thelott.com/set-for-life/results",
}

# Maps game names to the keys used in Number Oracle app
GAME_KEY_MAP = {
    "Powerball": "powerball",
    "Oz Lotto": "ozlotto",
    "Saturday Lotto": "saturday",
    "Weekday Windfall": "weekday",
    "Set for Life": "setforlife",
}

DAY_TO_GAMES = {
    "Monday": ["Weekday Windfall", "Set for Life"],
    "Tuesday": ["Oz Lotto", "Set for Life"],
    "Wednesday": ["Weekday Windfall", "Set for Life"],
    "Thursday": ["Powerball", "Set for Life"],
    "Friday": ["Weekday Windfall", "Set for Life"],
    "Saturday": ["Saturday Lotto", "Set for Life"],
    "Sunday": ["Set for Life"],
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Referer": "https://www.thelott.com/",
    "Connection": "keep-alive",
}


def load_results():
    """Load existing results from JSON file"""
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    # Initialize with empty arrays for each game
    return {key: [] for key in GAME_KEY_MAP.values()}


def save_results(results):
    """Save results to JSON file"""
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def extract_numbers(text):
    nums = re.findall(r"\b\d{1,2}\b", text)
    return nums


def parse_draw_date(date_str):
    """Try to parse the draw date into YYYY-MM-DD format"""
    if date_str == "Unknown":
        return datetime.now().strftime("%Y-%m-%d")

    # Remove day name if present (e.g., "Saturday, 28 March 2026")
    cleaned = re.sub(r"^[A-Za-z]+,?\s*", "", date_str.strip())

    for fmt in ["%d %B %Y", "%d %b %Y", "%d/%m/%Y", "%B %d, %Y"]:
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return datetime.now().strftime("%Y-%m-%d")


def parse_result(game, url):
    session = requests.Session()
    response = session.get(url, headers=HEADERS, timeout=30)

    if response.status_code == 403:
        print(f"⚠️ 403 blocked for {game}: {url}")
        return None

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    text = clean_text(soup.get_text(" ", strip=True))

    draw_match = re.search(r"Draw No\.?\s*(\d+)", text, re.IGNORECASE)
    draw_no = draw_match.group(1) if draw_match else "Unknown"

    date_match = re.search(r"([A-Za-z]{3,9},?\s+\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})", text)
    draw_date = date_match.group(1) if date_match else "Unknown"

    numbers = extract_numbers(text)

    # Parse into structured format for Number Oracle
    iso_date = parse_draw_date(draw_date)

    if game == "Powerball":
        main_nums = [int(n) for n in numbers[:7]]
        main_nums.sort()
        bonus = int(numbers[7]) if len(numbers) > 7 else None
        draw_data = {"date": iso_date, "numbers": main_nums}
        if bonus is not None:
            draw_data["bonus"] = bonus
    elif game == "Set for Life":
        main_nums = sorted([int(n) for n in numbers[:7]])
        draw_data = {"date": iso_date, "numbers": main_nums}
    elif game in ["Saturday Lotto", "Weekday Windfall"]:
        main_nums = sorted([int(n) for n in numbers[:6]])
        draw_data = {"date": iso_date, "numbers": main_nums}
    elif game == "Oz Lotto":
        main_nums = sorted([int(n) for n in numbers[:7]])
        draw_data = {"date": iso_date, "numbers": main_nums}
    else:
        main_nums = [int(n) for n in numbers[:6]]
        draw_data = {"date": iso_date, "numbers": main_nums}

    unique_key = f"{draw_no}|{draw_date}|{'-'.join(numbers[:12])}"

    return {
        "game": game,
        "draw_no": draw_no,
        "draw_date": draw_date,
        "draw_data": draw_data,
        "numbers": numbers[:12],
        "unique_key": unique_key,
        "url": url,
    }


def format_message(result):
    game = result["game"]
    draw_no = result["draw_no"]
    draw_date = result["draw_date"]
    nums = result["numbers"]

    if game == "Powerball":
        main_nums = nums[:7]
        powerball = nums[7] if len(nums) > 7 else "?"
        return (
            f"🎯 {game} Result\n\n"
            f"Draw No: {draw_no}\n"
            f"Date: {draw_date}\n"
            f"Numbers: {' '.join(main_nums)}\n"
            f"Powerball: {powerball}\n"
            f"\n{result['url']}"
        )
    else:
        main_nums = nums[:8]
        return (
            f"🎯 {game} Result\n\n"
            f"Draw No: {draw_no}\n"
            f"Date: {draw_date}\n"
            f"Numbers: {' '.join(main_nums)}\n"
            f"\n{result['url']}"
        )


def send_telegram(message):
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("CHAT_ID")
    if not token or not chat_id:
        print("⚠️ Telegram not configured, skipping notification")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    resp = requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=30)
    resp.raise_for_status()


def main():
    print("🚀 Script started")

    # Load existing results database
    all_results = load_results()

    # Load state for deduplication
    state_file = "lottery_state.json"
    state = {}
    if os.path.exists(state_file):
        with open(state_file, "r", encoding="utf-8") as f:
            state = json.load(f)

    today = datetime.now().strftime("%A")
    print("Today is:", today)

    games = DAY_TO_GAMES.get(today, [])
    updated = False

    for game in games:
        print("Checking:", game)

        url = GAME_URLS[game]
        result = parse_result(game, url)

        if result is None:
            print(f"Skipped {game} because blocked")
            continue

        # Check if this is a new result
        if state.get(game) != result["unique_key"]:
            # Send Telegram notification
            message = format_message(result)
            print(message)
            send_telegram(message)

            # Add to results database
            game_key = GAME_KEY_MAP[game]
            draw_data = result["draw_data"]

            # Check if this draw date already exists
            existing_dates = {d["date"] for d in all_results.get(game_key, [])}
            if draw_data["date"] not in existing_dates:
                if game_key not in all_results:
                    all_results[game_key] = []
                all_results[game_key].append(draw_data)
                # Sort by date
                all_results[game_key].sort(key=lambda x: x["date"])
                updated = True
                print(f"✅ Added {game} draw to results.json ({draw_data['date']})")
            else:
                print(f"ℹ️ {game} draw {draw_data['date']} already in results.json")

            # Update state
            state[game] = result["unique_key"]
        else:
            print(f"{game} no update")

    # Save state
    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    # Save results database
    if updated:
        save_results(all_results)
        print("💾 results.json updated")
    else:
        print("ℹ️ No new results to save")

    print("✅ Done")


if __name__ == "__main__":
    main()
