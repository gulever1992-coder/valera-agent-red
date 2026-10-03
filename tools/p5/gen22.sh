#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
f=tools/p5/q43_endzone.txt; out=art_src/l5_endzone.png
for try in 1 2 3; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen22)" >> $LOG
  timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_q43.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen22 finished $(date)" >> $LOG
