#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen8 finished" $LOG; do sleep 20; done
f=tools/p5/q26_gas.txt
for try in 1 2 3 4; do
  [ -f art_src/l5_gas.png ] && break
  echo "$(date) run $f try $try (gen9)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q26.log 2>&1
done
echo "gen9 finished $(date)" >> $LOG
