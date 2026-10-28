@echo off
setlocal
title 拾藏 AI
cd /d "%~dp0"

set "NODE_EXE="
where node >nul 2>nul && set "NODE_EXE=node"
if not defined NODE_EXE (
  for /f "delims=" %%N in ('dir /b /s "%USERPROFILE%\.cache\codex-runtimes\*\dependencies\node\bin\node.exe" 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
)

if not defined NODE_EXE (
  echo.
  echo [无法启动] 电脑上没有找到 Node.js。
  echo 请安装 Node.js 后重新双击本文件。
  echo 下载地址：https://nodejs.org/
  echo.
  pause
  exit /b 1
)

start "拾藏 AI 服务" /min "%NODE_EXE%" server.mjs
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173"

echo.
echo 拾藏 AI 已启动，浏览器将自动打开。
echo 如果没有自动打开，请访问：http://127.0.0.1:4173
echo.
echo 关闭“拾藏 AI 服务”窗口后，本地应用会停止运行。
timeout /t 5 /nobreak >nul
