#!/bin/bash
# Install the Mac job that fills in Dose of VetPrep answers (see
# answer_job.py) and the cleanup that removes it on 2029-01-01.
#
#   mac/install.sh FEED_URL KEY_FILE
#
# KEY_FILE holds the Apps Script's FEED_KEY (the VETPREP_FEED_KEY secret).
# Everything goes in one folder, including its own Python environment and
# Chromium, so cleanup.sh can remove it all.
set -euo pipefail

FEED_URL="$1"
KEY="$(tr -d '[:space:]' < "$2")"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/Library/Application Support/navle-review-answers"
LOG="$HOME/Library/Logs/navle-review-answers.log"
AGENTS="$HOME/Library/LaunchAgents"
JOB=com.louiekotler.navle-review-answers
CLEANUP=com.louiekotler.navle-review-answers.cleanup

mkdir -p "$APP" "$AGENTS"
cp "$SRC/mac/answer_job.py" "$SRC/mac/cleanup.sh" "$SRC/scripts/vetprep_answers.py" "$APP/"
chmod +x "$APP/cleanup.sh"
( umask 077; printf '{"feed_url": "%s", "key": "%s"}\n' "$FEED_URL" "$KEY" > "$APP/config.json" )

[ -x "$APP/venv/bin/python" ] || /opt/homebrew/bin/python3 -m venv "$APP/venv"
"$APP/venv/bin/pip" install -q --disable-pip-version-check playwright
PLAYWRIGHT_BROWSERS_PATH="$APP/browsers" "$APP/venv/bin/python" -m playwright install --only-shell chromium

plist() {  # label, then the ProgramArguments and schedule as raw plist XML
  cat > "$AGENTS/$1.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>$1</string>
$2
	<key>EnvironmentVariables</key>
	<dict>
		<key>PLAYWRIGHT_BROWSERS_PATH</key>
		<string>$APP/browsers</string>
	</dict>
	<key>RunAtLoad</key>
	<true/>
	<key>StandardOutPath</key>
	<string>$LOG</string>
	<key>StandardErrorPath</key>
	<string>$LOG</string>
</dict>
</plist>
EOF
}

plist "$JOB" "	<key>ProgramArguments</key>
	<array>
		<string>$APP/venv/bin/python</string>
		<string>$APP/answer_job.py</string>
	</array>
	<key>StartInterval</key>
	<integer>10800</integer>"

plist "$CLEANUP" "	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
		<string>$APP/cleanup.sh</string>
	</array>
	<key>StartCalendarInterval</key>
	<dict>
		<key>Hour</key>
		<integer>12</integer>
		<key>Minute</key>
		<integer>0</integer>
	</dict>"

for label in "$JOB" "$CLEANUP"; do
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$AGENTS/$label.plist"
done
echo "installed; log: $LOG"
