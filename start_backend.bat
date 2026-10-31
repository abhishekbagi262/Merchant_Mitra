@echo off
title MerchantMitra Backend API Server
echo ====================================================
echo Starting MerchantMitra Backend API Server...
echo ====================================================
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend

echo Using Python from virtual environment:
"%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Please make sure port 8000 is not in use.
)
pause
