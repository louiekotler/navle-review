#!/bin/bash
# Remove the Mac answer job once it is no longer wanted: from 2029-01-01
# this deletes the app folder (Python, Chromium, key), the log and both
# launch agents, including this one. Before that date it does nothing.
# launchd runs it daily and at login, so a Mac that is off on Jan 1 cleans
# up the next time it starts.

APP="$HOME/Library/Application Support/navle-review-answers"
LOG="$HOME/Library/Logs/navle-review-answers.log"
AGENTS="$HOME/Library/LaunchAgents"
JOB=com.louiekotler.navle-review-answers
CLEANUP=com.louiekotler.navle-review-answers.cleanup

[ "$(date +%Y%m%d)" -lt "${NAVLE_CLEANUP_AFTER:-20290101}" ] && exit 0

launchctl bootout "gui/$(id -u)/$JOB" 2>/dev/null
rm -f "$AGENTS/$JOB.plist" "$AGENTS/$CLEANUP.plist"
rm -rf "$APP"
rm -f "$LOG"
# Last, since it stops this script.
launchctl bootout "gui/$(id -u)/$CLEANUP" 2>/dev/null
exit 0
