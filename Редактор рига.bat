@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю редактор рига Семёна... Не закрывай это окно, пока работаешь.
start "rig-server" /min py tools/p10/rig/edit_server.py
start "game-server" /min py -m http.server 8782 --directory "%~dp0."
timeout /t 2 >nul
start "" "http://localhost:8782/tools/p10/rig/editor.html"
