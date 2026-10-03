#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen19 finished" $LOG; do sleep 20; done
for f in tools/p5/q40_walkB1.txt tools/p5/q41_walkB2.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.[a-z]*" $f | sed 's/Target file: //')
  for try in 1 2 3; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen20)" >> $LOG
    timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_$(basename $f .txt).log 2>&1
    [ -f "$out" ] || sleep 20
  done
done
echo "gen20 finished $(date)" >> $LOG
