#!/bin/bash
# Tool Table - One-click deployment script

echo "========================================"
echo "  Tool Table - 網路管理工具入口網站"
echo "========================================"
echo

cd "$(dirname "$0")"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "[1/3] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
echo "[2/3] Activating virtual environment..."
source venv/bin/activate

# Install dependencies
if [ ! -f "venv/.installed" ]; then
    echo "[3/3] Installing dependencies..."
    pip install -r requirements.txt --quiet
    touch venv/.installed
else
    echo "[3/3] Dependencies already installed"
fi

# Run migration if database doesn't exist
if [ ! -f "data/tool-table.db" ]; then
    echo
    echo "[INFO] First run detected, migrating YAML data..."
    python migrate_yaml_to_sqlite.py
fi

echo
echo "========================================"
echo "  Server starting at http://localhost:8080"
echo "  Admin panel: http://localhost:8080/admin"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
