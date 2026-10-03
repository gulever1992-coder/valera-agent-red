#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen3 finished" $LOG; do sleep 30; done
f=tools/p5/q01_cut_cars.txt
for try in 1 2 3 4; do
  [ -f art_src/l5_cut_cars.png ] && break
  echo "$(date) run $f try $try (gen4)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q01b.log 2>&1
  if [ -f art_src/l5_cut_cars.png ]; then echo "$(date) OK art_src/l5_cut_cars.png gen4" >> $LOG; fi
done
echo "gen4 finished $(date)" >> $LOG
