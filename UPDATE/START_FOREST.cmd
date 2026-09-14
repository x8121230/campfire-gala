@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 START_FOREST.py
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python 3 is required. Please install Python 3 and try again.
  ) else (
    python START_FOREST.py
  )
)
pause
