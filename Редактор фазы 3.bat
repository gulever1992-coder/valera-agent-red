@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю Редактор фазы 3 (уровень 10, море)... Не закрывай это окно, пока работаешь.
start "sem3-server" /min py tools/p10/sem3/sem_server.py
start "sem3-game" /min py -m http.server 8788 --directory "%~dp0."
timeout /t 2 >nul
start "" "http://localhost:8788/tools/p10/sem3/editor.html"
