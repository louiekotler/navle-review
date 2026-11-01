"""Fill in Dose of VetPrep answers from this Mac.

GitHub's runners are stopped by vetprep.com's bot checkpoint, a home
connection is not, so launchd runs this every few hours. It asks the Apps
Script feed (with the key) for recent questions that still have no answer,
opens each email's first choice link in headless Chromium, and posts the
answers back to the Apps Script; the GitHub workflow then picks them up.

Reads APP_DIR/config.json: {"feed_url": ..., "key": ...}. Installed by
mac/install.sh; mac/cleanup.sh removes everything on 2029-01-01.
"""
import datetime as dt
import json
import pathlib
import sys
import urllib.parse
import urllib.request

APP_DIR = pathlib.Path(__file__).resolve().parent
END = dt.date(2029, 1, 1)


def log(msg):
    print(f"{dt.datetime.now():%Y-%m-%d %H:%M} {msg}", flush=True)


def request(url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def main():
    if dt.date.today() >= END:
        log("past the end date; cleanup.sh removes this job")
        return
    cfg = json.loads((APP_DIR / "config.json").read_text())
    feed = request(cfg["feed_url"] + "?" + urllib.parse.urlencode({"key": cfg["key"]}))
    pending = {i["link"]: i for i in feed if i.get("link") and not i.get("answer")}
    if not pending:
        log("no unanswered questions")
        return

    sys.path.insert(0, str(APP_DIR))
    from vetprep_answers import read_answers

    answers = []
    for link, result in read_answers(list(pending)).items():
        item = pending[link]
        if result.get("answer") in item["choices"]:
            answers.append({"date": item["date"], "answer": result["answer"],
                            "explanation": result.get("explanation", "")})
        else:
            log(f"{item['date']}: {result.get('error') or 'answer not among the choices'}")
    if answers:
        res = request(cfg["feed_url"], {"key": cfg["key"], "answers": answers})
        log(f"sent {len(answers)} answer(s): {res}")


if __name__ == "__main__":
    main()
