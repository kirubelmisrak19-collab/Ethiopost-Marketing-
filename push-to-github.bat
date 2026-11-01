@echo off
setlocal enabledelayedexpansion
title Ethiopost Marketing - GitHub Deployment Helper
color 0B

echo ======================================================================
echo          ETHIOPOST MARKETING COMMAND CENTER - GITHUB SYNC             
echo ======================================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

cd /d "%~dp0"

echo Current project folder: %CD%
echo.

set "DEFAULT_REPO=https://github.com/kirubelmisrak19-collab/Ethiopost-Marketing-.git"

echo [1] Push to configured repository:
echo     %DEFAULT_REPO%
echo.
echo Choose authentication method:
echo   [1] Automatic Browser / Git Login (Default)
echo   [2] Paste GitHub Personal Access Token (Bypasses password errors)
echo   [3] Change Repository URL
echo.
set /p CHOICE="Select option (1, 2, or 3) [Default: 1]: "

if "%CHOICE%"=="2" goto :USE_TOKEN
if "%CHOICE%"=="3" goto :CUSTOM_URL

:DEFAULT_PUSH
set "TARGET_URL=%DEFAULT_REPO%"
goto :DO_PUSH

:CUSTOM_URL
set /p TARGET_URL="Enter your GitHub Repository URL: "
if "%TARGET_URL%"=="" set "TARGET_URL=%DEFAULT_REPO%"
goto :DO_PUSH

:USE_TOKEN
echo.
echo Note: Create a token at GitHub -> Settings -> Developer Settings -> Personal access tokens
echo (Select 'Tokens classic' and check the 'repo' permission box).
echo.
set /p GHTOKEN="Paste your GitHub Token: "
if "%GHTOKEN%"=="" (
    echo [ERROR] Token cannot be empty.
    pause
    exit /b 1
)
set "TARGET_URL=https://%GHTOKEN%@github.com/kirubelmisrak19-collab/Ethiopost-Marketing-.git"
goto :DO_PUSH

:DO_PUSH
echo.
echo [1/3] Configuring Git remote origin...
git remote remove origin >nul 2>&1
git remote add origin %TARGET_URL%

echo [2/3] Setting branch to main...
git branch -M main

echo [3/3] Uploading code to GitHub...
echo.
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! All 26 files have been uploaded to your GitHub repository!
    echo   Render or Railway will now automatically detect your code and build.
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo   [NOTICE] Git Push could not authenticate.
    echo.
    echo   EASIEST 30-SECOND ALTERNATIVE:
    echo   1. Open: https://github.com/kirubelmisrak19-collab/Ethiopost-Marketing-
    echo   2. Click "uploading an existing file"
    echo   3. Drag and drop all files from this folder and click "Commit changes"!
    echo ======================================================================
)

echo.
pause
