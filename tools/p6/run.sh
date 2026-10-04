#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
for q in c1_forest:forest_tall c2_vova:vovawalk6 c3_wiz:wizwalk6 c4_vande:vandewalk6; do
  f=tools/p6/${q%%:*}.txt; out=art_src/l6/${q##*:}.png
  for try in 1 2; do
    [ -f "$out" ] && break
    echo "$(date) $f try $try" >> tools/p6/gen.log
    timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p6/out_${q%%:*}.log 2>&1
  done
  [ -f "$out" ] && echo "OK $out" >> tools/p6/gen.log || echo "FAIL $out" >> tools/p6/gen.log
done
echo done >> tools/p6/gen.log
