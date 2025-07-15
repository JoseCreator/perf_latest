@echo off
echo 🧹 Login Credentials Cleanup Tool
echo.
echo This will help you clear stored login credentials:
echo.
echo 1. Clear browser saved passwords:
echo    - Chrome: Ctrl+Shift+Delete
echo    - Edge: Ctrl+Shift+Delete  
echo    - Firefox: Ctrl+Shift+Delete
echo.
echo 2. Clear autofill data:
echo    - Chrome: Settings > Autofill > Passwords
echo    - Edge: Settings > Passwords
echo    - Firefox: Options > Privacy > Saved Passwords
echo.
echo 3. Clear localStorage (automatic when you restart dev server)
echo.
echo 4. Restart your development server:
call npm run dev
echo.
echo Your login form should now be completely clean!
pause
