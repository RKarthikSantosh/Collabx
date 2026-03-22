@echo off
REM CollabX Quick Start Script for Windows

echo.
echo ====================================
echo   CollabX - Collaborative Coding
echo ====================================
echo.

REM Check if node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js v16+
    pause
    exit /b 1
)

echo [✓] Node.js is installed
echo.

REM Check if Python is installed
where python >nul 2>nul
if errorlevel 1 (
    echo [!] Python not found (optional for Python support)
) else (
    echo [✓] Python is installed
)

REM Check if Java is installed
where javac >nul 2>nul
if errorlevel 1 (
    echo [!] Java not found (optional for Java support)
) else (
    echo [✓] Java is installed
)

echo.
echo Starting CollabX...
echo.
echo Starting Backend Server (port 5000)...
echo.

cd /d "%~dp0server"
start cmd /k "npm start"

timeout /t 3 /nobreak

echo.
echo Starting Frontend Server (port 5173)...
echo.

cd /d "%~dp0client"
start cmd /k "npm run dev"

echo.
echo ====================================
echo   CollabX is starting!
echo ====================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:5000
echo.
echo Open your browser to http://localhost:5173
echo.
pause
