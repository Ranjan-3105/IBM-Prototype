@echo off
setlocal
title SkillBridge launcher
cd /d "%~dp0"

rem Prefer the portable Node 22 in .tools (the pinned Vite 8 / Mongoose 9 need Node 20.19+).
if exist "%~dp0.tools\node22\node.exe" set "PATH=%~dp0.tools\node22;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 22 LTS from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
for /f %%v in ('node -v') do echo Using Node %%v

if not exist "server\.env" (
  echo Creating server\.env in demo mode: temporary in-memory MongoDB, AI fallbacks.
  for /f %%s in ('node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))"') do set "JWT=%%s"
  (
    echo PORT=5000
    echo MONGODB_URI=memory
    echo JWT_SECRET=!JWT!
    echo GEMINI_API_KEY=
    echo GEMINI_MODEL=gemini-2.5-flash
    echo CLIENT_URL=http://localhost:5173
  ) > "server\.env.tmp"
)
if exist "server\.env.tmp" (
  powershell -NoProfile -Command "(Get-Content 'server\.env.tmp') -replace '!JWT!', '%JWT%' | Set-Content 'server\.env'"
  del "server\.env.tmp"
)
if not exist "client\.env" echo VITE_API_URL=/api> "client\.env"

if not exist "server\node_modules" (
  echo Installing server packages - first run only...
  pushd server & call npm install --no-audit --no-fund & popd
)
if not exist "client\node_modules" (
  echo Installing client packages - first run only...
  pushd client & call npm install --no-audit --no-fund & popd
)

start "SkillBridge API" /D "%~dp0server" cmd /k npm run dev
start "SkillBridge client" /D "%~dp0client" cmd /k npm run dev

echo.
echo SkillBridge is starting in two windows:
echo   API     http://localhost:5000/api/health
echo   App     http://localhost:5173
echo First run downloads MongoDB for demo mode, so the API can take a few minutes.
echo To use Atlas instead, put your connection string in server\.env as MONGODB_URI.
echo.
timeout /t 8 >nul
