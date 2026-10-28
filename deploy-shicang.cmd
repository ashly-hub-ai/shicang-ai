@echo off
setlocal
cd /d "%~dp0"

set "SHICANG_NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if not exist "%SHICANG_NODE_BIN%\node.exe" goto NODE_MISSING
set "PATH=%SHICANG_NODE_BIN%;%PATH%"

set "CLOUDBASE_CLI=%~dp0work\cloudbase-cli\node_modules\.bin\cloudbase.cmd"
set "CLOUDBASE_SAFE_HOME=%~dp0work\tcb-home"
set "NODE_OPTIONS=--require=%~dp0work\cloudbase-cli\homedir-override.cjs"
set "SHICANG_ENV=shicang-d5ghnihwq293cd52c"

echo [1/3] Checking Tencent Cloud login...
call "%CLOUDBASE_CLI%" env list >nul 2>&1
if errorlevel 1 goto LOGIN
goto DEPLOY

:LOGIN
echo Please confirm authorization in the Tencent Cloud page.
call "%CLOUDBASE_CLI%" login --flow web
if errorlevel 1 goto FAILED

:DEPLOY
echo [2/3] Publishing the latest Shicang version...
call "%CLOUDBASE_CLI%" hosting deploy "%~dp0public" -e "%SHICANG_ENV%" --entry index.html
if errorlevel 1 goto FAILED

echo [3/3] Deployment succeeded. Opening the online app...
start "" "https://shicang-d5ghnihwq293cd52c-1490550935.tcloudbaseapp.com/?updated=20261028"
echo.
echo Shicang AI has been updated successfully.
pause
exit /b 0

:FAILED
echo.
echo Deployment did not finish. The previous online version is still safe.
echo Please take a screenshot of this window and send it to Codex.
pause
exit /b 1

:NODE_MISSING
echo.
echo The Node runtime required for deployment could not be found.
echo Please send a screenshot of this window to Codex.
pause
exit /b 1
