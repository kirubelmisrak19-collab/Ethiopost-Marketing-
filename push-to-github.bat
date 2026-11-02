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
echo   [2] Paste GitHub Personal Access Token (Recommended - Bypasses password errors)
echo   [3] Change Repository URL
echo.
set /p CHOICE="Select option (1, 2, or 3) [Default: 2]: "
if "%CHOICE%"=="" set "CHOICE=2"

if "%CHOICE%"=="1" goto :DEFAULT_PUSH
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
echo ----------------------------------------------------------------------
echo  Get a 30-second token here: https://github.com/settings/tokens/new
echo  (Name it "deploy" and check the "repo" checkbox)
echo ----------------------------------------------------------------------
echo.
set /p GHTOKEN="Paste your GitHub Token (ghp_...): "
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

echo [3/3] Uploading all files and folders to GitHub...
echo.
git push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! All files and folders (including public/ and vercel.json)
    echo   have been cleanly synced to GitHub!
    echo   Vercel will now automatically trigger a successful build!
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo   [ERROR] Git push failed. Please verify your token and try again.
    echo ======================================================================
)

echo.
pause
