#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
for f in tools/p5/q20_roofs_a.txt tools/p5/q21_roofs_b.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen6)" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
  done
done
echo "gen6 finished $(date)" >> $LOG
