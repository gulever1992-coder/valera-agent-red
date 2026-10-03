#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
while ! grep -q "gen18 finished" $LOG; do sleep 20; done
for f in tools/p5/q36_cliff_bg.txt tools/p5/q38_comic_end1.txt tools/p5/q39_comic_end2.txt tools/p5/q37_matiz_side.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.[a-z]*" $f | sed 's/Target file: //')
  for try in 1 2 3 4; do
    [ -f "$out" ] && break
    echo "$(date) run $f try $try (gen19)" >> $LOG
    timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p5/out_$(basename $f .txt).log 2>&1
    [ -f "$out" ] || sleep 20
  done
done
echo "gen19 finished $(date)" >> $LOG
