@echo off
where python >nul 2>nul
if not errorlevel 1 (
  python "%~dp0start-website.py"
  goto end
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0start-website.py"
  goto end
)
echo Python 3 is required to start the website.
:end
pause
