#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
for n in "$@"; do
  f=tools/pcov/cov$n.txt; out=art_src/covers/cov$n.png
  for try in 1 2; do
    [ -f "$out" ] && break
    echo "$(date) cov$n try $try" >> tools/pcov/gen.log
    timeout 900 codex exec -m gpt-5.6-terra -s workspace-write --skip-git-repo-check "$(cat $f)" < /dev/null > tools/pcov/out_cov$n.log 2>&1
  done
  [ -f "$out" ] && echo "OK $out" >> tools/pcov/gen.log || echo "FAIL $out" >> tools/pcov/gen.log
done
echo done >> tools/pcov/gen.log
