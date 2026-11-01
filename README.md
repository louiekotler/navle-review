# NAVLE Review

A study page for the free daily NAVLE® practice questions from Zuku Learning
(Question of the Day) and VetPrep (Dose of VetPrep): multiple choice with
images, explanations and simple spaced repetition. Progress is kept in each
browser's local storage.

## How it updates

- **Zuku**: every question is public at
  `zukulearning.com/questions/YYYY-MM-DD/?topic=navle`.
  `scripts/zuku_scrape.py` fetches new days; the archive starts 2024-01-01.
- **VetPrep**: only sent by email. `apps-script/Code.gs` runs hourly in the
  receiving Google account, reads the emails (read-only Gmail access) into a
  spreadsheet and serves them as JSON. `scripts/vetprep_sync.py` pulls that
  feed using the `VETPREP_FEED_URL` repository secret. The answer is not in
  the email: with the `VETPREP_FEED_KEY` secret the feed also returns each
  recent email's first choice link, and `scripts/vetprep_answers.py` opens it
  in headless Chromium (as tapping it would, which records that choice) and
  reads the correct answer and explanation. That works from a home
  connection but not from GitHub's runners, where vetprep.com shows a
  "Vercel Security Checkpoint", so it runs on the owner's Mac instead (see
  below) and posts the answers back to the Apps Script. Questions appear as
  soon as the email does; their answers follow the next time the Mac runs.
- `.github/workflows/update.yml` runs both twice a day, commits new data and
  deploys `scripts/build_site.py`'s output to GitHub Pages.

## Run locally

```
python3 scripts/build_site.py data _site
python3 -m http.server -d _site
```

## Apps Script setup

Create a project at script.google.com in the account that receives the
emails, paste `Code.gs` and `appsscript.json` (show the manifest under
Project Settings), run `install` once to authorize and add the hourly
trigger, run `makeKey` and save the logged key as the `VETPREP_FEED_KEY`
secret, then Deploy → Web app (execute as me, anyone) and save the URL as
the `VETPREP_FEED_URL` secret.

## Mac answer job

`mac/install.sh FEED_URL KEY_FILE` installs `mac/answer_job.py` as a
launch agent that runs every 3 hours and at login, in
`~/Library/Application Support/navle-review-answers` (its own Python
environment and Chromium), logging to
`~/Library/Logs/navle-review-answers.log`. A second agent runs
`mac/cleanup.sh` daily; from 2029-01-01 it removes that folder, the log
and both agents.

Questions are © Zuku Learning and VetPrep; this is a personal study aid.
NAVLE® is a registered trademark of the ICVA.
