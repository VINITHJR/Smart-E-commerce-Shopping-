@echo off
echo ========================================
echo Starting Fashion Scraper + Virtual Try-On
echo ========================================
echo.
echo Starting Fashion Scraper Backend (Port 5000)...
start "Fashion Scraper Backend" cmd /k "python fashion_scraper/backend.py"
timeout /t 2 /nobreak >nul
echo.
echo Starting Virtual Try-On Backend (Port 5001)...
start "Virtual Try-On Backend" cmd /k "python app.py"
timeout /t 3 /nobreak >nul
echo.
echo ========================================
echo Both servers are starting!
echo.
echo Open your browser and go to:
echo http://localhost:5001/integrated
echo ========================================
echo.
pause

