@echo off
echo 📚 Generating documentation...
call npm run docs

if %ERRORLEVEL% EQU 0 (
    echo ✅ Documentation generated successfully!
    echo 🌐 Opening documentation in browser...
    start http://127.0.0.1:8080
    call npm run docs:serve
) else (
    echo ❌ Documentation generation failed!
    pause
)
