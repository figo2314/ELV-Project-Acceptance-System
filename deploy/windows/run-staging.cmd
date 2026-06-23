@echo off
setlocal

set "ELV_ROOT=C:\ELV_Project_Acceptance"
set "ELV_APP=%ELV_ROOT%\app"
set "ELV_NODE=%ELV_ROOT%\runtime\node\node.exe"
set "ELV_LOG=%ELV_ROOT%\logs"

if not exist "%ELV_LOG%" mkdir "%ELV_LOG%"
cd /d "%ELV_APP%"

"%ELV_NODE%" --env-file=.env server\index.js 1>>"%ELV_LOG%\api.log" 2>>"%ELV_LOG%\api-error.log"
exit /b %ERRORLEVEL%
