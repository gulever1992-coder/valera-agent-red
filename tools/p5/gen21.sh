#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen20 finished" $LOG; do sleep 20; done
f=tools/p5/q42_card.txt; out=art_src/l5_card.jpg
for try in 1 2 3; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen21)" >> $LOG
  timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_q42_card.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen21 finished $(date)" >> $LOG
