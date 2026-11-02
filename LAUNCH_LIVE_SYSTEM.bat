@echo off
setlocal enabledelayedexpansion
title Ethiopost Marketing Command Center - LIVE LAUNCHER
color 1F

echo ===============================================================================
echo             ETHIOPOST MARKETING COMMAND CENTER - INSTANT LIVE LAUNCHER         
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js server...
curl -s http://127.0.0.1:3050/api/overview >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   - Server is already running on port 3050.
) else (
    echo   - Starting Node.js server...
    start /B node server.js
    timeout /t 3 >nul
)

echo.
echo [2/3] Connecting secure worldwide HTTPS tunnel...
echo.
echo ===============================================================================
echo   YOUR LIVE PUBLIC LINK WILL APPEAR BELOW (Look for https://...lhr.life):
echo   Keep this window open while your team is using the system!
echo ===============================================================================
echo.

ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -R 80:127.0.0.1:3050 nokey@localhost.run

pause
