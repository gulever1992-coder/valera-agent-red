#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while [ "$(date +%H%M)" -lt 2150 ] && [ "$(date +%H)" -ge 12 ]; do sleep 60; done
f=tools/p5/q44_autozak.txt; out=art_src/l5_autozak.png
for try in 1 2 3; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen24)" >> $LOG
  timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_q44.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen24 finished $(date)" >> $LOG
