@echo off
chcp 65001 1>NUL 2>NUL
cd /d "%~dp0"
set PORT=8080
set BIN=%~dp0bin\miniserve-win-x86_64.exe

if not exist "%BIN%" (
  echo Cannot find %BIN%
  echo Please make sure the bin folder is intact.
  pause
  exit /b 1
)

if not exist ".\out" (
  echo Cannot find .\out folder. Please make sure files are intact.
  pause
  exit /b 1
)

echo Starting... browser will open at http://localhost:%PORT%
echo To stop the server, close this window or press Ctrl+C.

start "" cmd /c "timeout /t 2 /nobreak 1>NUL 2>NUL & start http://localhost:%PORT%"
"%BIN%" --index index.html --port %PORT% --quiet ".\out"
\r