@echo off
chcp 65001 >nul
title Tool Table Server

echo ========================================
echo   Tool Table - 網路管理工具入口網站
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Create virtual environment if not exists
if not exist "venv" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
if not exist "venv\.installed" (
    echo [3/3] Installing dependencies...
    pip install -r requirements.txt --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo. > venv\.installed
) else (
    echo [3/3] Dependencies already installed
)

REM Check if database exists, if not run migration
if not exist "data\tool-table.db" (
    echo.
    echo [INFO] First run detected, migrating YAML data...
    python migrate_yaml_to_sqlite.py
)

echo.
echo ========================================
echo   Server starting at http://localhost:8080
echo   Admin panel: http://localhost:8080/admin
echo   Press Ctrl+C to stop
echo ========================================
echo.

REM Start server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

pause
