import asyncio
import json
import re
import time
import csv
from browser_use import Agent
from browser_use.llm import ChatAnthropic

TASK = """
Go to https://www.saucedemo.com/
Log in with username 'standard_user' and password 'secret_sauce'.
Find the product "Sauce Labs Backpack" on the products page and note its exact price as shown.
Add it to the cart.
Note the number shown on the cart badge icon.
Click on the cart to view it.
Note the exact price shown for "Sauce Labs Backpack" in the cart.

Return your findings as JSON only, in this exact format, with no extra commentary:
{
  "listed_price": "<price as shown on product page>",
  "cart_badge_count": "<number on cart badge>",
  "cart_price": "<price as shown in cart>"
}
"""

def normalize_price(p: str) -> str:
    return re.sub(r"[^\d.]", "", p or "")

def extract_json(text: str) -> dict:
    # Handles cases where the agent wraps JSON in prose or code fences
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in output")
    return json.loads(match.group(0))

async def run_once(run_id: int):
    start = time.time()
    result_text = ""
    row = {
        "run_id": run_id,
        "completed": False,
        "json_parsed": False,
        "passed": False,
        "listed_price": None,
        "cart_price": None,
        "cart_badge_count": None,
        "duration_sec": None,
        "error": "",
        "raw_output": "",
    }

    try:
        agent = Agent(
            task=TASK,
            llm=ChatAnthropic(model="claude-sonnet-4-6"),
        )
        history = await agent.run()
        result_text = str(history.final_result()) if hasattr(history, "final_result") else str(history)
        row["completed"] = True
        row["raw_output"] = result_text[:500]  # truncate for CSV sanity

        data = extract_json(result_text)
        row["json_parsed"] = True
        row["listed_price"] = data.get("listed_price")
        row["cart_price"] = data.get("cart_price")
        row["cart_badge_count"] = data.get("cart_badge_count")

        price_match = normalize_price(data.get("listed_price")) == normalize_price(data.get("cart_price"))
        count_match = str(data.get("cart_badge_count")).strip() == "1"
        row["passed"] = price_match and count_match

    except Exception as e:
        row["error"] = str(e)

    row["duration_sec"] = round(time.time() - start, 2)
    return row

async def main(n_runs: int = 3):
    rows = []
    for i in range(1, n_runs + 1):
        print(f"Running trial {i}/{n_runs}...")
        row = await run_once(i)
        rows.append(row)
        print(f"  -> completed={row['completed']} passed={row['passed']} time={row['duration_sec']}s")

    with open("browseruse_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    n_passed = sum(r["passed"] for r in rows)
    print(f"\n{n_passed}/{n_runs} runs passed. Results saved to browseruse_results.csv")

if __name__ == "__main__":
    asyncio.run(main(3))