# Veri kaynakları

| Dosya | İçerik | Kaynak | Lisans |
|---|---|---|---|
| `world.json` | Kara (1:50m), göller, ülke sınır çizgileri, şehirler | [Natural Earth](https://www.naturalearthdata.com) `ne_50m_land`, `ne_50m_lakes`, `ne_50m_admin_0_boundary_lines_land`, `ne_50m_populated_places_simple` | Kamu malı |
| `turkey.json` | Türkiye kara sınırı ve kıyısı (1:10m) | Natural Earth `ne_10m_admin_0_countries_tur` (Türkiye görüş açısı sürümü) | Kamu malı |
| `fir.json` | FIR sınırları, ICAO kodları ve adları | [VATSpy Data Project](https://github.com/vatsimnetwork/vatspy-data-project) `Boundaries.geojson`, `VATSpy.dat` (VATSIM) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `mavivatan.json` | Mavi Vatan dış sınırı | Bu projede, Natural Earth 1:10m kıyılarından medyan hat kuralıyla üretildi (`tools/veri/mavi_vatan.py`) | — |
| `bluemarble.jpg` | Uydu görüntüsü, 5400×2700, eşdikdörtgen | NASA Earth Observatory, Blue Marble Next Generation | Kamu malı |

## Değişiklikler

- Bütün vektör veriler Ramer–Douglas–Peucker yöntemiyle sadeleştirildi ve koordinatlar yuvarlandı (taban harita 0,02°, Türkiye 0,004°).
- `fir.json`, VATSpy verisinin sadeleştirilmiş bir türevidir: yalnızca dört harfli ICAO kodlu FIR'lar alınmış, sektörler ve frekans bilgileri çıkarılmış, adlar kısaltılmıştır. **Bu dosya CC BY-SA 4.0 lisansıyla paylaşılır**; kaynak: VATSIM / VATSpy Data Project katkıcıları.
- `mavivatan.json` resmî bir koordinat seti değildir; yöntem ve doğrulama için ana `README.md`'deki "Mavi Vatan sınırı hakkında" bölümüne bakın.

FIR ve Mavi Vatan sınırları bilgi amaçlıdır; seyrüsefer ve resmî işlemler için AIP ve resmî kaynaklar esas alınmalıdır.
