@echo off
title Push MerchantMitra to GitHub
echo ====================================================
echo Pushing MerchantMitra to GitHub...
echo Repository: https://github.com/abhishekbagi262/Merchant_Mitra.git
echo ====================================================
cd /d "%~dp0"

git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo [SUCCESS] MerchantMitra successfully pushed to GitHub!
    echo Check: https://github.com/abhishekbagi262/Merchant_Mitra
    echo ====================================================
) else (
    echo.
    echo [ERROR] Push failed. If prompted, please sign in to GitHub
    echo or provide your GitHub Personal Access Token (PAT).
)

echo.
pause
