#!/bin/bash
# Очередь генерации арта уровня 5: ждёт сброса лимита Codex (3 окт 01:40), потом по порядку q01..q10.
# Пропускает уже готовые файлы; при лимите ждёт 25 минут и повторяет. После каждой картинки пересобирает ассеты.
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
echo "start $(date)" >> $LOG
TARGET=
if [ -n "$TARGET" ]; then
  while [ $(date +%s) -lt $TARGET ]; do sleep 60; done
fi
for f in tools/p5/q*.txt; do
  out=$(grep -o "Target file: art_src/[A-Za-z0-9_]*\.png" $f | sed 's/Target file: //')
  for try in 1 2 3 4 5 6 7 8; do
    if [ -f "$out" ]; then break; fi
    echo "$(date) run $f try $try" >> $LOG
    codex exec -s workspace-write --skip-git-repo-check "$(cat $f)" > tools/p5/out_$(basename $f .txt).log 2>&1
    if [ -f "$out" ]; then echo "$(date) OK $out" >> $LOG; py tools/build_l5.py >> $LOG 2>&1; break; fi
    if grep -q "usage limit" tools/p5/out_$(basename $f .txt).log; then echo "$(date) limit, sleep" >> $LOG; sleep 1500; else sleep 30; fi
  done
done
echo "finished $(date)" >> $LOG
