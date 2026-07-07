@echo off
title Auto Screenshot Dashboard Launcher
echo ====================================================
echo   AUTO SCREENSHOT DASHBOARD LAUNCHER FOR WINDOWS
echo ====================================================
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak terdeteksi di komputer Anda!
    echo.
    echo Dashboard ini membutuhkan Node.js agar Puppeteer browser bisa berjalan.
    echo.
    echo Silakan unduh dan instal Node.js (versi LTS direkomendasikan) dari:
    echo https://nodejs.org/
    echo.
    echo Setelah menginstal Node.js, silakan buka kembali file start.bat ini.
    echo.
    pause
    exit
)

echo [OK] Node.js terdeteksi.
echo.

:: Install dependencies if node_modules folder does not exist
if not exist node_modules (
    echo [INFO] Menginstal dependensi (express, puppeteer, cors)...
    echo Harap tunggu, ini mungkin membutuhkan waktu 1-2 menit...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal dependensi! Pastikan Anda terhubung ke internet.
        pause
        exit
      )
    echo.
    echo [OK] Dependensi berhasil diinstal.
    echo.
)

:: Start the Express server and open browser
echo [INFO] Menjalankan server dashboard...
echo.
echo ====================================================
echo   SERVER AKTIF! Browser akan terbuka otomatis.
echo   Jika tidak terbuka, buka alamat ini secara manual:
echo   http://localhost:3000
echo ====================================================
echo.

:: Open default browser to the localhost URL
start http://localhost:3000

:: Start the node application
call npm start
pause
