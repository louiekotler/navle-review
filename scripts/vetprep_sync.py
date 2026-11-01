"""Pull Dose of VetPrep questions from the Apps Script feed into the repo.

The Apps Script in apps-script/ reads the Dose of VetPrep emails and serves
them as JSON. This merges that feed into DATA_DIR/vetprep.jsonl (keyed by
the date the email arrived) and downloads each question image. With
VETPREP_FEED_KEY set, the feed also carries each recent email's first choice
link, and questions still missing an answer get it from vetprep_answers.py.

Usage: VETPREP_FEED_URL=... [VETPREP_FEED_KEY=...] python3 scripts/vetprep_sync.py DATA_DIR
"""
import json
import os
import pathlib
import sys
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (personal study archive)"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main(data):
    url = os.environ.get("VETPREP_FEED_URL")
    if not url:
        print("VETPREP_FEED_URL not set, skipping VetPrep")
        return
    key = os.environ.get("VETPREP_FEED_KEY")
    if key:
        url += "?" + urllib.parse.urlencode({"key": key})
    data = pathlib.Path(data)
    (data / "images").mkdir(parents=True, exist_ok=True)
    db = data / "vetprep.jsonl"
    have = {}
    if db.exists():
        for line in db.read_text().splitlines():
            if line:
                r = json.loads(line)
                have[r["date"]] = r

    feed = json.loads(fetch(url))
    changed, pending = 0, {}
    for item in feed:
        old = have.get(item["date"], {})
        rec = {
            "date": item["date"],
            "topic": "vetprep",
            "url": None,
            "question": item["question"],
            "choices": item["choices"],
            # The sheet never holds answers; keep ones read earlier.
            "answer": item.get("answer") or old.get("answer"),
            "explanation": item.get("explanation") or old.get("explanation") or "",
            "image_url": item.get("image_url") or None,
        }
        if rec["image_url"]:
            name = f"vetprep-{rec['date']}{pathlib.Path(rec['image_url']).suffix.lower()}"
            path = data / "images" / name
            if not path.exists():
                path.write_bytes(fetch(rec["image_url"]))
            rec["image"] = name
        if not rec["answer"] and item.get("link"):
            pending[item["link"]] = rec
        if old != rec:
            have[rec["date"]] = rec
            changed += 1

    if pending:
        from vetprep_answers import read_answers
        for link, result in read_answers(list(pending)).items():
            rec = pending[link]
            answer = result.get("answer")
            if answer not in rec["choices"]:
                print(f"vetprep: no answer for {rec['date']}: {result.get('error') or 'answer not among the choices'}")
                continue
            rec["answer"], rec["explanation"] = answer, result.get("explanation", "")
            have[rec["date"]] = rec
            changed += 1
            print(f"vetprep: answer read for {rec['date']}")

    db.write_text("".join(json.dumps(have[d], ensure_ascii=False) + "\n" for d in sorted(have)))
    print(f"vetprep: {changed} new or updated, total {len(have)}")


if __name__ == "__main__":
    main(sys.argv[1])
