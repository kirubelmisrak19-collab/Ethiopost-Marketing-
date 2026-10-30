@echo off
setlocal
echo ============================================================
echo   Ethiopost Marketing Command Center - Push to GitHub
echo ============================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

if "%~1"=="" (
    set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/ethiopost-marketing.git): "
) else (
    set "REPO_URL=%~1"
)

if "%REPO_URL%"=="" (
    echo [ERROR] No GitHub URL provided. Exiting.
    pause
    exit /b 1
)

echo.
echo [1/3] Setting remote origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [2/3] Setting default branch to main...
git branch -M main

echo [3/3] Pushing code to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Code pushed to GitHub successfully.
    echo   Now proceed to Render.com or Railway.app to deploy!
    echo ============================================================
) else (
    echo.
    echo [ERROR] Git push failed. Please verify your GitHub URL and credentials.
)
echo.
pause
