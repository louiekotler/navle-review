"""Pull Dose of VetPrep questions from the Apps Script feed into the repo.

The Apps Script in apps-script/ reads the Dose of VetPrep emails and serves
them as JSON. This merges that feed into DATA_DIR/vetprep.jsonl (keyed by
the date the email arrived) and downloads each question image. Answers are
filled in by the Mac job (mac/answer_job.py) through the Apps Script. With
VETPREP_FEED_KEY set, the feed also carries each recent email's first choice
link; a question still waiting for its answer keeps that link as check_url,
so the site can send the reader to VetPrep's answer page meanwhile.

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
    changed = 0
    for item in feed:
        old = have.get(item["date"], {})
        answer = item.get("answer") or old.get("answer")
        rec = {
            "date": item["date"],
            "topic": "vetprep",
            "url": None,
            "question": item["question"],
            "choices": item["choices"],
            "answer": answer,
            "explanation": item.get("explanation") or old.get("explanation") or "",
            "image_url": item.get("image_url") or None,
            # The email's own link, so it records a choice for the subscriber;
            # dropped once the answer is in.
            "check_url": None if answer else item.get("link") or old.get("check_url"),
        }
        if rec["image_url"]:
            name = f"vetprep-{rec['date']}{pathlib.Path(rec['image_url']).suffix.lower()}"
            path = data / "images" / name
            if not path.exists():
                path.write_bytes(fetch(rec["image_url"]))
            rec["image"] = name
        if old != rec:
            have[rec["date"]] = rec
            changed += 1

    db.write_text("".join(json.dumps(have[d], ensure_ascii=False) + "\n" for d in sorted(have)))
    waiting = sum(1 for r in have.values() if not r.get("answer"))
    print(f"vetprep: {changed} new or updated, total {len(have)}, {waiting} waiting for an answer")


if __name__ == "__main__":
    main(sys.argv[1])
