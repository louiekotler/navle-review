"""Scrape Zuku Learning's public Question of the Day archive.

Pages live at https://www.zukulearning.com/questions/YYYY-MM-DD/?topic=<topic>
(topics: navle, clinical-sciences, vtne), weekdays from 2024-01-01. The
correct choice is marked data-is-correct="1" and the explanation is in the
page HTML, so no login is needed.

Usage: python3 zuku_scrape.py OUT_DIR [--topic navle] [--start 2024-01-01]
Writes OUT_DIR/<topic>.jsonl (one question per line) and OUT_DIR/images/.
Already-scraped dates are skipped, so reruns only fetch new days.
"""
import argparse
import datetime as dt
import html
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

BASE = "https://www.zukulearning.com/questions/{date}/?topic={topic}"
UA = {"User-Agent": "Mozilla/5.0 (personal study archive)"}
PLACEHOLDER = "default-qotd-image"


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def text(fragment):
    fragment = re.sub(r'<div class="[^"]*visually-hidden[^"]*">.*?</div>', "", fragment, flags=re.S)
    # Lab-value tables become one "cell | cell" line per row.
    fragment = re.sub(r"\s*</t[dh]>\s*", " | ", fragment)
    fragment = re.sub(r"\s*\|?\s*</tr>", "\n", fragment)
    fragment = re.sub(r"<br\s*/?>|</p>", "\n", fragment)
    fragment = html.unescape(re.sub(r"<[^>]+>", "", fragment))
    return "\n".join(l.strip() for l in fragment.splitlines() if l.strip())


def parse(page, date, topic):
    h = page.decode("utf-8", "replace")
    q = re.search(r'class="qotd__featured-question">(.*?)<div class="qotd__featured-options">', h, re.S)
    if not q:
        return None
    choices = re.findall(r'data-is-correct="(1?)"\s*>\s*<label[^>]*>(.*?)</label>', h, re.S)
    fb = re.search(r'class="qotd__featured-answer-feedback">(.*?)</div>\s*</div>\s*</div>', h, re.S)
    img = re.search(r'class="qotd-featured-image">.*?<img[^>]*src="([^"]+)"', h, re.S)
    img_url = img.group(1) if img and PLACEHOLDER not in img.group(1) else None
    return {
        "date": date,
        "topic": topic,
        "url": BASE.format(date=date, topic=topic),
        "question": text(q.group(1)),
        "choices": [text(c) for _, c in choices],
        "answer": next((text(c) for ok, c in choices if ok), None),
        "explanation": text(fb.group(1)) if fb else "",
        "image_url": img_url,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--topic", default="navle")
    ap.add_argument("--start", default="2024-01-01")
    ap.add_argument("--delay", type=float, default=0.5)
    a = ap.parse_args()

    out = pathlib.Path(a.out)
    (out / "images").mkdir(parents=True, exist_ok=True)
    db = out / f"{a.topic}.jsonl"
    seen = set()
    if db.exists():
        seen = {json.loads(l)["date"] for l in db.read_text().splitlines() if l}

    day, today = dt.date.fromisoformat(a.start), dt.date.today()
    added = 0
    with db.open("a") as f:
        while day <= today:
            d = day.isoformat()
            day += dt.timedelta(days=1)
            if d in seen or dt.date.fromisoformat(d).weekday() >= 5:
                continue
            # Zuku intermittently 404s or serves a page without the question,
            # so retry before treating the day as having none.
            rec = None
            for attempt in range(3):
                page = fetch(BASE.format(date=d, topic=a.topic))
                time.sleep(a.delay * (1 + 4 * attempt))
                rec = parse(page, d, a.topic) if page else None
                if rec:
                    break
            if not rec:
                print(f"{a.topic}: no question for {d}", file=sys.stderr)
                continue
            if rec["image_url"]:
                name = f"zuku-{a.topic}-{d}{pathlib.Path(rec['image_url']).suffix}"
                path = out / "images" / name
                data = None if path.exists() else fetch(rec["image_url"])
                if data:
                    path.write_bytes(data)
                if path.exists():
                    rec["image"] = name
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            f.flush()
            added += 1
    print(f"{a.topic}: added {added}, total {len(seen) + added}")


if __name__ == "__main__":
    main()
