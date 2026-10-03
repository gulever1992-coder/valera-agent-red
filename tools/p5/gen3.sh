#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log; while ! grep -q "gen2 finished" $LOG; do sleep 30; done
for f in tools/p5/q17_cars3.txt tools/p5/q18_props2.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4 5 6; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
    if [ -f "$out" ]; then echo "$(date) OK $out" >> $LOG; break; fi
    if grep -q "usage limit" tools/p5/out_$(basename $f .txt).log; then echo "limit" >> $LOG; sleep 1500; else sleep 30; fi
  done
done
echo "gen3 finished $(date)" >> $LOG
