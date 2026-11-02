@echo off
:: Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ==============================================================================
    echo  ADMINISTRATOR PERMISSION NEEDED
    echo ==============================================================================
    echo  Please right-click this file and select "Run as administrator".
    echo  This is required to allow your team to connect through Windows Firewall.
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

echo ==============================================================================
echo       ETHIOPOST MARKETING COMMAND CENTER - OFFICE NETWORK ENABLER
echo ==============================================================================
echo.

echo [1/2] Opening Port 3050 in Windows Firewall...
netsh advfirewall firewall delete rule name="Ethiopost Marketing Command Center" >nul 2>&1
netsh advfirewall firewall add rule name="Ethiopost Marketing Command Center" dir=in action=allow protocol=TCP localport=3050 >nul

echo [2/2] Checking Server Status...
cd /d "%~dp0"
curl -s http://127.0.0.1:3050/api/overview >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Server is already running.
) else (
    echo   - Starting Node.js server...
    start /B node server.js
)

echo.
echo ==============================================================================
echo   SUCCESS! The system is now live for your entire office network.
echo.
echo   Share either of these links with your colleagues:
echo     Cable/LAN: http://172.20.18.151:3050
echo     Office Wi-Fi: http://192.168.167.3:3050
echo.
echo   Any colleague on your office network can now open it immediately!
echo ==============================================================================
echo.
pause
