@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю конструктор моря (уровень 10, фаза 3)... Не закрывай это окно, пока работаешь.
start "sea-server" /min py tools/p10/sea3/sea_server.py
start "sea-game" /min py -m http.server 8786 --directory "%~dp0."
timeout /t 2 >nul
start "" "http://localhost:8786/tools/p10/sea3/editor.html"
