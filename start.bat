@echo off
title FairSight - AI Bias Audit Engine
color 0B

echo.
echo  ███████╗ █████╗ ██╗██████╗ ███████╗██╗ ██████╗ ██╗  ██╗████████╗
echo  ██╔════╝██╔══██╗██║██╔══██╗██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝
echo  █████╗  ███████║██║██████╔╝███████╗██║██║  ███╗███████║   ██║
echo  ██╔══╝  ██╔══██║██║██╔══██╗╚════██║██║██║   ██║██╔══██║   ██║
echo  ██║     ██║  ██║██║██║  ██║███████║██║╚██████╔╝██║  ██║   ██║
echo  ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝
echo.
echo  Real-Time AI Bias Audit Engine v1.0.0
echo.

echo [1/3] Setting up Python backend...
cd backend
if not exist venv (
    python -m venv venv
    echo   Virtual environment created
)
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
echo   Dependencies installed

start /B uvicorn main:app --host 0.0.0.0 --port 8000 --reload
echo   Backend started ^-^> http://localhost:8000
cd ..

timeout /t 2 /nobreak > nul

echo [2/3] Setting up React frontend...
cd frontend
if not exist node_modules (
    npm install
    echo   Node modules installed
)

start /B npm run dev
echo   Frontend started ^-^> http://localhost:5175
cd ..

echo.
echo  ==========================================
echo   FairSight is running!
echo   Dashboard ^-^> http://localhost:5175
echo   API Docs  ^-^> http://localhost:8000/docs
echo  ==========================================
echo.
echo  Press Ctrl+C to stop
echo.
pause
