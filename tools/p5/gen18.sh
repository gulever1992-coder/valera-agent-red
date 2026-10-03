#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
for f in tools/p5/q30_leaves.txt tools/p5/q31_trees2.txt tools/p5/q32_vova_rear2.txt tools/p5/q33_potholes.txt tools/p5/q34_walkA.txt tools/p5/q35_walkB.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen18)" >> $LOG
    timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_$(basename $f .txt).log 2>&1
    [ -f "$out" ] || sleep 20
  done
done
echo "gen18 finished $(date)" >> $LOG
