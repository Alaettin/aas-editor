@echo off
cd /d "%~dp0backend"
start "AAS API Backend" cmd /c "npm run dev"

cd /d "%~dp0frontend"
npm run dev
