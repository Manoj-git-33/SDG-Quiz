@echo off
title Kahoot Live Quiz Server
cd /d "%~dp0"

echo ===================================================
echo 🚀 Starting Kahoot Live Quiz Server...
echo ===================================================

:: Start node server.js
start cmd /k "node server.js"

:: Wait 2 seconds for server startup
timeout /t 2 > nul

:: Open Host view in default browser
start http://localhost:3000/host.html

echo.
echo ✅ Server started! Host screen opened at http://localhost:3000/host.html
echo.
pause
