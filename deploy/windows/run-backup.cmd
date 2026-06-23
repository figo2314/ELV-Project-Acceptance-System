@echo off
setlocal

set "ELV_ROOT=C:\ELV_Project_Acceptance"
set "ELV_APP=%ELV_ROOT%\app"
set "ELV_NODE=%ELV_ROOT%\runtime\node\node.exe"
set "ELV_PG_BIN=%ELV_ROOT%\runtime\postgresql\pgsql\bin"
set "ELV_LOG=%ELV_ROOT%\logs"

if not exist "%ELV_LOG%" mkdir "%ELV_LOG%"
set "PATH=%ELV_PG_BIN%;%PATH%"
cd /d "%ELV_APP%"

"%ELV_NODE%" --env-file=.env scripts\backup-production.mjs 1>>"%ELV_LOG%\backup.log" 2>>"%ELV_LOG%\backup-error.log"
exit /b %ERRORLEVEL%
