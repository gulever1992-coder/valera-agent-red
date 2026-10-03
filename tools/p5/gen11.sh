#!/bin/bash
cd /c/Users/gulev/CRM/valera-game
while ! grep -q "gen10 finished" tools/p5/gen.log; do sleep 60; done
py tools/build_l5.py >> tools/p5/gen.log 2>&1
sed -i "s/G.VER='\([0-9]*\)'/G.VER='9\1'/" js/engine.js
echo "gen11 built $(date)" >> tools/p5/gen.log
