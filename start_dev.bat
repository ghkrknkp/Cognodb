@echo off
echo ==============================================
echo  Starting MetroGraph Explorer (WEXA AI CognoDB)
echo ==============================================

echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "MetroGraph Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo.
echo Starting React Vite Frontend on http://localhost:5173 ...
start "MetroGraph Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
