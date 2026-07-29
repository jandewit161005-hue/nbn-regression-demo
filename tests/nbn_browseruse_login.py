from dotenv import load_dotenv
import os
load_dotenv()
EMAIL = os.getenv("NBN_QA_EMAIL")
PASSWORD = os.getenv("NBN_QA_PASSWORD")
API_KEY = os.getenv("ANTHROPIC_API_KEY")

import asyncio
import csv
import json
import re          
import shutil
import tempfile
import time
from datetime import datetime, timezone

from browser_use import Agent, Browser
from browser_use.llm import ChatAnthropic

# --- Taak: niet enkel inloggen, maar doorgaan tot een echte verificatie ---
# Pas NORM_QUERY / EXPECTED_STATUS aan naar de norm die je als testcase gebruikt.
NORM_QUERY = "NBN EN 1090-3:2019"

TASK = f"""
Go to https://app-qa.nbn.be/data/r/platform/frontend/login
If a cookie consent banner appears, click "Deny All" or the equivalent to dismiss it.
Log in using Email: {EMAIL}
Password: {PASSWORD}
After logging in, search for the standard "{NORM_QUERY}".
Open its detail page.
Report the current URL, and the publication status (e.g. Active/Withdrawn)
and publication date shown on the detail page.

Return your findings as JSON only, no extra commentary, in this exact format:
{{
  "current_url": "<the exact URL of the detail page>",
  "status": "<publication status found on the page>",
  "publication_date": "<publication date found on the page>"
}}
"""

N_RUNS = 3
OUTPUT_CSV = "nbn_verification_results.csv"


def extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in output")
    return json.loads(match.group(0))


async def run_once(run_number: int, llm) -> dict:
    # --- FIX: verse browsercontext per run ---
    fresh_profile = tempfile.mkdtemp(prefix=f"bu_profile_run{run_number}_")

    browser = Browser(
    headless=True,
    user_data_dir=fresh_profile,
)

    agent = Agent(task=TASK, browser=browser, llm=llm)
    

    start = time.time()
    status = "FAIL"
    result_text = ""
    parsed = {}
    try:
        history = await agent.run()
        result_text = str(history.final_result()) if hasattr(history, "final_result") else str(history)
        parsed = extract_json(result_text)
        status = "PASS"
    except Exception as e:
        result_text = f"ERROR: {e}"
    finally:

     duration = round(time.time() - start, 2)
    for close_method in ("kill", "stop", "close"):
        method = getattr(browser, close_method, None)
        if method is not None:
            try:
                result = method()
                if asyncio.iscoroutine(result):
                    await result
                break
            except Exception:
                continue

    shutil.rmtree(fresh_profile, ignore_errors=True)

    return {
        "run": run_number,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "duration_seconds": duration,
        "reported_url": parsed.get("current_url", ""),
        "reported_status": parsed.get("status", ""),
        "reported_date": parsed.get("publication_date", ""),
        "raw_output_excerpt": result_text[:200],
    }


async def main():
    llm = ChatAnthropic(model="claude-sonnet-4-6")
    rows = []

    for i in range(1, N_RUNS + 1):
        print(f"--- Run {i}/{N_RUNS} (verse browsercontext) ---")
        row = await run_once(i, llm)
        print(row)
        rows.append(row)

    write_header = not os.path.exists(OUTPUT_CSV)
    with open(OUTPUT_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        if write_header:
            writer.writeheader()
        writer.writerows(rows)

    print(f"\nResultaten weggeschreven naar {OUTPUT_CSV}")
    print("Check duration_seconds: blijven de tijden nu gelijk over de 3 runs")
    print("(i.p.v. dalend), dan bevestigt dat de cache-hypothese uit de")
    print("vorige login-test.")


if __name__ == "__main__":
    asyncio.run(main())