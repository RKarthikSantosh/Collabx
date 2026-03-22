#!/bin/bash

# CollabX Quick Start Script for macOS/Linux

echo ""
echo "===================================="
echo "  CollabX - Collaborative Coding"
echo "===================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js v16+"
    exit 1
fi

echo "[✓] Node.js is installed"
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "[✓] Python is installed"
else
    echo "[!] Python not found (optional for Python support)"
fi

# Check if Java is installed
if command -v javac &> /dev/null; then
    echo "[✓] Java is installed"
else
    echo "[!] Java not found (optional for Java support)"
fi

echo ""
echo "Starting CollabX..."
echo ""

# Start backend
echo "Starting Backend Server (port 5000)..."
cd "$(dirname "$0")/server"
npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting Frontend Server (port 5173)..."
cd "$(dirname "$0")/client"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "===================================="
echo "  CollabX is starting!"
echo "===================================="
echo ""
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:5000"
echo ""
echo "Open your browser to http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep script running
wait
