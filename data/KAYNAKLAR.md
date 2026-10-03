# Veri kaynakları

| Dosya | İçerik | Kaynak | Lisans |
|---|---|---|---|
| `world.json` | Kara (1:50m), göller, ülke sınır çizgileri, şehirler | [Natural Earth](https://www.naturalearthdata.com) `ne_50m_land`, `ne_50m_lakes`, `ne_50m_admin_0_boundary_lines_land`, `ne_50m_populated_places_simple` | Kamu malı |
| `kara_detay.json` | Türkiye ve çevresi için kara ve göller (1:10m), bölge kutusuna kırpılmış | Natural Earth `ne_10m_land`, `ne_10m_lakes` | Kamu malı |
| `tr_idari.json` | Türkiye 81 il ve 973 ilçe sınırı ve poligonu, adları ve etiket noktaları | [geoBoundaries](https://www.geoboundaries.org) TUR ADM1 / ADM2 (kaynak: [OpenStreetMap](https://www.openstreetmap.org/copyright)) | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| `turkey.json` | Türkiye kara sınırı ve kıyısı (1:10m) | Natural Earth `ne_10m_admin_0_countries_tur` (Türkiye görüş açısı sürümü) | Kamu malı |
| `fir.json` | FIR sınırları, ICAO kodları ve adları | [VATSpy Data Project](https://github.com/vatsimnetwork/vatspy-data-project) `Boundaries.geojson`, `VATSpy.dat` (VATSIM) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `mavivatan.json` | Mavi Vatan dış sınırı | Bu projede, Natural Earth 1:10m kıyılarından medyan hat kuralıyla üretildi (`tools/veri/mavi_vatan.py`) | — |
| `bluemarble.jpg` | Uydu görüntüsü, 5400×2700, eşdikdörtgen | NASA Earth Observatory, Blue Marble Next Generation | Kamu malı |
| `uydu_doseme.json` | Yaklaşınca netleşen uydu döşemeleri (Web Mercator, z6–z8; bölge ~1 km, Türkiye ~500 m/piksel) | NASA GIBS, Blue Marble Shaded Relief & Bathymetry; [FreeTiler](https://github.com/freetiler/nasa-bluemarble) aynasından | Kamu malı (NASA) |

## Değişiklikler

- Bütün vektör veriler Ramer–Douglas–Peucker yöntemiyle sadeleştirildi ve koordinatlar yuvarlandı (taban harita 0,02°, Türkiye 0,004°).
- `fir.json`, VATSpy verisinin sadeleştirilmiş bir türevidir: yalnızca dört harfli ICAO kodlu FIR'lar alınmış, sektörler ve frekans bilgileri çıkarılmış, adlar kısaltılmıştır. **Bu dosya CC BY-SA 4.0 lisansıyla paylaşılır**; kaynak: VATSIM / VATSpy Data Project katkıcıları.
- `tr_idari.json` OpenStreetMap verisinden türetilmiş bir veritabanıdır: ilçe sınırları sahip ilçe çiftine göre zincirlenmiş ve her zincir bir kez saklanmış (il sınırı, ilçe sınırı, dış sınır), ilçe poligonları bu zincirlerin numaralarıyla kurulmuş, il sınırları ilçe sınırlarından türetilmiş, çizgiler ~250–300 m'ye sadeleştirilmiştir. Merkez ilçe adları resmî biçime ("Çanakkale Merkez") getirilmiş, "Prince Islands" → "Adalar" yapılmıştır. **Bu dosya ODbL 1.0 lisansıyla paylaşılır; © OpenStreetMap katkıcıları.**
- `mavivatan.json` resmî bir koordinat seti değildir; yöntem ve doğrulama için ana `README.md`'deki "Mavi Vatan sınırı hakkında" bölümüne bakın.

## Uydu paketi (isteğe bağlı, depoda yok)

`tools/uydu_paketi.py` varsayılan olarak **EOX Sentinel-2 cloudless 2016** döşemelerini indirir: "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)", [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Atıf metni pakete yazılır ve paket kullanılan paftalara basılır. EOX'un 2018 ve sonraki yıl katmanları CC BY-NC-SA 4.0'dır (ticari olmayan kullanım); `--katman` ile seçilirse lisans koşulları kullanıcıya aittir.

FIR ve Mavi Vatan sınırları bilgi amaçlıdır; seyrüsefer ve resmî işlemler için AIP ve resmî kaynaklar esas alınmalıdır.
