@echo off
echo ==========================================
echo   IT Coffee - Frontend Setup
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo Starting dev server at http://localhost:5173 ...
npm run dev
