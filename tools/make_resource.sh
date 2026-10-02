#!/usr/bin/env sh
# PAFTA - Windows kaynak dosyasını (ikon, sürüm bilgisi, manifest) üretir:
#   desktop/rsrc_windows_amd64.syso
# Gereksinim: llvm-windres (LLVM) ya da mingw-w64 windres. Üretilen .syso depoda durur;
# yalnızca ikon, sürüm ya da manifest değiştiğinde yeniden çalıştırmak gerekir.
set -e
cd "$(dirname "$0")/../desktop"
SURUM=$(tr -d ' \r\n' < ../VERSION)
VIRGUL=$(echo "$SURUM" | tr '.' ',')
cp ../assets/icon.ico icon.ico
cat > pafta.rc <<RC
#pragma code_page(65001)
1 ICON "icon.ico"
1 24 "app.manifest"
1 VERSIONINFO
FILEVERSION $VIRGUL,0
PRODUCTVERSION $VIRGUL,0
FILEFLAGSMASK 0x3f
FILEFLAGS 0x0
FILEOS 0x40004
FILETYPE 0x1
FILESUBTYPE 0x0
BEGIN
  BLOCK "StringFileInfo"
  BEGIN
    BLOCK "041F04B0"
    BEGIN
      VALUE "CompanyName", "mhmmtbg"
      VALUE "FileDescription", "PAFTA — koordinatlardan ölçekli harita"
      VALUE "FileVersion", "$SURUM"
      VALUE "InternalName", "PAFTA"
      VALUE "LegalCopyright", "Harita verileri: Natural Earth, © OpenStreetMap katkıcıları (ODbL), VATSpy (CC BY-SA 4.0), NASA"
      VALUE "OriginalFilename", "PAFTA.exe"
      VALUE "ProductName", "PAFTA"
      VALUE "ProductVersion", "$SURUM"
    END
  END
  BLOCK "VarFileInfo"
  BEGIN
    VALUE "Translation", 0x041F, 1200
  END
END
RC
WINDRES=$(command -v llvm-windres || command -v llvm-windres-18 || command -v x86_64-w64-mingw32-windres)
"$WINDRES" --target=pe-x86-64 --codepage=65001 -O coff -i pafta.rc -o rsrc_windows_amd64.syso
rm -f pafta.rc icon.ico
echo "Tamamlandı: desktop/rsrc_windows_amd64.syso ($SURUM)"
