@echo off
title Ethiopost Marketing Command Center
echo ===================================================================
echo     ETHIOPOST MARKETING COMMAND CENTER - PRODUCTION LAUNCHER
echo ===================================================================
echo.
cd /d "%~dp0"

REM Ensure data directory exists
if not exist "data" mkdir "data"

echo Starting Ethiopost Marketing Command Center on Port 3050...
echo.
echo [LOCAL ACCESS]    http://localhost:3050/
echo [OFFICE NETWORK]  http://172.20.18.151:3050/
echo.
echo Press Ctrl+C to stop the server at any time.
echo -------------------------------------------------------------------

node server.js
pause
