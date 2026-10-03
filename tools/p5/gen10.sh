#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
T=$(date -d "2026-10-03 05:16" +%s)
while [ $(date +%s) -lt $T ]; do sleep 60; done
for f in tools/p5/q25_lights.txt tools/p5/q26_gas.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4 5 6; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen10)" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
    [ -f "$out" ] || { if grep -q "usage limit" tools/p5/out_$(basename $f .txt).log; then sleep 1800; else sleep 30; fi; }
  done
done
echo "gen10 finished $(date)" >> $LOG
