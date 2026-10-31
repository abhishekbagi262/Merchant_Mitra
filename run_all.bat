@echo off
title MerchantMitra Full Stack Launcher
echo ====================================================
echo Launching MerchantMitra (Backend + Frontend)...
echo ====================================================

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "MerchantMitra Backend" cmd /k "cd /d ""%~dp0backend"" && set PYTHONPATH=%~dp0backend && ""%~dp0backend\.venv\Scripts\python.exe"" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Waiting 2 seconds for backend initialization...
timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server on http://localhost:3000 ...
start "MerchantMitra Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ====================================================
echo MerchantMitra is running!
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:3000
echo ====================================================
echo.
pause
