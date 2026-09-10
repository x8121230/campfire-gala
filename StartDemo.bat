@echo off
cd /d "%~dp0"
echo Open http://localhost:8000/demo.html after the server starts.
echo Press Ctrl+C to stop the local demo server.
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 -m http.server 8000 --bind 127.0.0.1
) else (
    python -m http.server 8000 --bind 127.0.0.1
)
pause
