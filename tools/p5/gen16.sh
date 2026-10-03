#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
while [ ! -f art_src/l5_trees2.png ]; do sleep 20; done; sleep 5
LOG=tools/p5/gen.log
f=tools/p5/q32_vova_rear2.txt
out=art_src/l5_vova_rear2.png
for try in 1 2 3 4; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen16)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q32_vova_rear2.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen16 finished $(date)" >> $LOG
