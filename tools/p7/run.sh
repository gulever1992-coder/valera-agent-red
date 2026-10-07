#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
for q in "$@"; do
  f=tools/p7/${q%%:*}.txt; out=art_src/l7/${q##*:}.png
  for try in 1 2; do
    [ -f "$out" ] && break
    echo "$(date) $f try $try" >> tools/p7/gen.log
    timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/p7/out_${q%%:*}.log 2>&1
  done
  [ -f "$out" ] && echo "OK $out" >> tools/p7/gen.log || echo "FAIL $out" >> tools/p7/gen.log
done
echo done >> tools/p7/gen.log
