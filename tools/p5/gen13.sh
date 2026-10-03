#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
f=tools/p5/q29_spikes.txt
out=art_src/l5_spikes.png
for try in 1 2 3 4; do
  [ -f "$out" ] && break
  echo "$(date) run $f try $try (gen13)" >> $LOG
  codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_q29_spikes.log 2>&1
  [ -f "$out" ] || sleep 20
done
echo "gen13 finished $(date)" >> $LOG
