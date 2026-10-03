#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
while [ ! -f art_src/l5_vova_rear2.png ]; do sleep 20; done; sleep 5
LOG=tools/p5/gen.log
for f in tools/p5/q33_potholes.txt tools/p5/q34_walkA.txt tools/p5/q35_walkB.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen17)" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
    [ -f "$out" ] || sleep 20
  done
done
echo "gen17 finished $(date)" >> $LOG
