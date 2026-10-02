@echo off
rem PAFTA - Windows exe derleme betigi
rem Gereksinim: Python 3, Go 1.22+ ve ilk derlemede bagimliliklar icin internet
setlocal
cd /d "%~dp0"
python ..\tools\build_html.py || goto :hata
copy /y ..\app\pafta.html app.html >nul || goto :hata
go mod tidy || goto :hata
if not exist ..\dist mkdir ..\dist
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -trimpath -ldflags "-H windowsgui -s -w" -o ..\dist\PAFTA.exe . || goto :hata
echo Tamamlandi: dist\PAFTA.exe
exit /b 0
:hata
echo Derleme basarisiz.
exit /b 1
