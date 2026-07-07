@echo off
title Auto Screenshot Desktop Installer Builder
echo ====================================================
echo   AUTO SCREENSHOT DESKTOP INSTALLER COMPILER
echo ====================================================
echo.
echo Sedang menyiapkan compiler, harap tunggu...
echo.

:: Add local Node directory path to system env variables for this session
set PATH=%PATH%;C:\Program Files\nodejs

:: Run electron-builder compiler to generate setup exe
call npm run dist

echo.
echo ====================================================
echo   SUCCESS: Installer Setup berhasil dibuat!
echo   Buka folder 'dist/' di komputer Anda.
echo   File installer: dist\AutoScreenshotDashboard Setup 1.0.0.exe
echo ====================================================
echo.
pause
