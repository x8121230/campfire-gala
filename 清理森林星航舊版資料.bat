@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

if exist "assets\forest-starflight\phase1\standalone.js" del /q "assets\forest-starflight\phase1\standalone.js"
if exist "星航_v0.3_先看這裡.txt" del /q "星航_v0.3_先看這裡.txt"
if exist "星航_v0.4_先看這裡.txt" del /q "星航_v0.4_先看這裡.txt"
if exist "星航_v0.5_先看這裡.txt" del /q "星航_v0.5_先看這裡.txt"
if exist "星航_v0.5.1_先看這裡.txt" del /q "星航_v0.5.1_先看這裡.txt"
if exist "星航_v0.8.1_安裝與驗收.txt" del /q "星航_v0.8.1_安裝與驗收.txt"
if exist "tests\starflight_v081_integration.test.mjs" del /q "tests\starflight_v081_integration.test.mjs"
if exist "tests\starflight_phase2_scene.test.mjs" del /q "tests\starflight_phase2_scene.test.mjs"

echo.
echo 森林星航舊版執行檔與舊驗收資料已清理。
echo v0.9.3 不受影響。
echo.
pause
