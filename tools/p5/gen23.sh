#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
LOG=tools/p5/gen.log
# лимит Codex до 21:40 — ждём
while [ "$(date +%H%M)" -lt 2142 ] && [ "$(date +%H)" -ge 12 ]; do sleep 60; done
bash tools/p5/gen22.sh
