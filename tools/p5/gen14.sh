#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
f=tools/p5/q30_leaves.txt
out=art_src/l5_leaves.png
for try in 1 2 3 4; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen14)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q30_leaves.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen14 finished $(date)" >> $LOG
