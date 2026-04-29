@echo off
chcp 65001 > nul
echo =======================================================
echo          DokonPro ERP v2 - Ishga tushirilmoqda...
echo =======================================================

echo [1/2] Backend server ishga tushirilmoqda...
start cmd /k "cd /d c:\dokon\backend && venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 > nul

echo [2/2] Frontend interfeysi ishga tushirilmoqda...
start cmd /k "cd /d c:\dokon\frontend && npm run dev"

echo =======================================================
echo DokonPro ERP tayyor!
echo Brauzerda: http://localhost:5173
echo Login: admin / Parol: admin123 / PIN: 0000
echo =======================================================
