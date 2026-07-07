@echo off
title Auto Screenshot Dashboard EXE Builder
echo ====================================================
echo   AUTO SCREENSHOT DASHBOARD EXE BUILD COMPILER
echo ====================================================
echo.

:: Add local Node directory path to system env variables for this session
set PATH=%PATH%;C:\Program Files\nodejs

:: Run build-exe node script
call npm run build-exe

echo.
echo Selesai! File 'Auto-Screenshot-Dashboard.exe' siap digunakan.
pause
