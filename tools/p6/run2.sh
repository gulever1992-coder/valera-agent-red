#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
until grep -q '^done' tools/p6/gen.log; do sleep 10; done
for try in 1 2; do
  [ -f art_src/l6/wizwalk6.png ] && break
  echo "$(date) c3b_wiz try $try" >> tools/p6/gen.log
  timeout 900 codex exec -s workspace-write --skip-git-repo-check "$(cat tools/p6/c3b_wiz.txt)" < /dev/null > tools/p6/out_c3b_wiz.log 2>&1
done
[ -f art_src/l6/wizwalk6.png ] && echo "OK2 wizwalk6" >> tools/p6/gen.log || echo "FAIL2 wizwalk6" >> tools/p6/gen.log
