#!/usr/bin/env sh
# PAFTA - Windows exe derleme betiği (Linux/macOS'ta çapraz derleme)
# Gereksinim: Python 3, Go 1.22+ ve ilk derlemede bağımlılıklar için internet
set -e
cd "$(dirname "$0")"
python3 ../tools/build_html.py
cp ../app/pafta.html app.html
go mod tidy
mkdir -p ../dist
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../dist/PAFTA.exe .
echo "Tamamlandı: dist/PAFTA.exe"
