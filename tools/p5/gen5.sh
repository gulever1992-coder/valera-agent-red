#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log; f=tools/p5/q19_kop_parts.txt
for try in 1 2 3 4; do
  [ -f art_src/l5_kop_parts.png ] && break
  echo "$(date) run $f try $try (gen5)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q19.log 2>&1
done
echo "gen5 finished $(date)" >> $LOG
