#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen7 finished" $LOG; do sleep 20; done
for f in tools/p5/q24_decals.txt tools/p5/q25_lights.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen8)" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
  done
done
echo "gen8 finished $(date)" >> $LOG
