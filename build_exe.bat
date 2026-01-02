@echo off
SETLOCAL

echo ==========================================
echo    MxAIA Standalone Builder (Prototype)
echo ==========================================

echo [1/3] Installing/Updating dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies.
    goto :Error
)

echo [2/3] Compiling TypeScript to JavaScript...
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo Error compiling TypeScript.
    goto :Error
)

echo [3/3] Packaging into .exe (using pkg)...
call npm run pkg
IF %ERRORLEVEL% NEQ 0 (
    echo Error during pkg generation.
    goto :Error
)

echo.
echo ==========================================
echo    SUCCESS!
echo    Executable created at: dist\mxaia.exe
echo ==========================================
echo.
pause
exit /b 0

:Error
echo.
echo ==========================================
echo    BUILD FAILED
echo ==========================================
pause
exit /b 1
