@echo off
title MerchantMitra Frontend (Vite)
echo ====================================================
echo Starting MerchantMitra Frontend UI...
echo ====================================================
cd /d "%~dp0frontend"

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend failed to start.
)
pause
