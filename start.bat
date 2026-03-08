@echo off
cd /d "%~dp0backend"
start "AAS API Backend" cmd /k "npm run dev"

cd /d "%~dp0frontend"
npm run dev
