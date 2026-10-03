# Geliştirme ve Derleme

## Klasör yapısı

```
app/pafta.html          derlenmiş tek dosyalık uygulama (dağıtılan dosya)
src/pafta.src.html      arayüz, stiller ve çizim motoru (veriler yer tutucu olarak)
src/app.js              proje dosyası, masaüstü köprüsü, kısayollar, sürükle-bırak, haritadan seç, açılış ekranı
src/moduller/           özellik modülleri (aşağıdaki tablo); ada göre sırayla app.js'in arkasına eklenir
data/                   gömülü harita verileri (JSON) ve uydu görüntüsü
desktop/                Windows exe sarmalayıcısı (Go + WebView2)
assets/                 uygulama ikonu ve işaret (SVG)
tools/build_html.py     src/ + data/  ->  app/pafta.html
tools/make_icon.py      assets/icon.ico, icon.png, mark.svg
tools/make_resource.sh  desktop/rsrc_windows_amd64.syso (ikon, sürüm bilgisi, manifest)
tools/uydu_paketi.py    çevrimdışı uydu paketi (.paftauydu) hazırlayıcı; internete bağlı bilgisayarda çalışır
tools/veri/             data/ dosyalarını ham kaynaklardan yeniden üreten betikler
ornekler/               örnek .pafta projesi
VERSION                 sürüm numarası (HTML, exe sürüm bilgisi ve "Hakkında" buradan okur)
```

## Mimari

Uygulama saf HTML, CSS ve JavaScript'tir; harita `<canvas>` üzerine çizilir. Hiçbir kütüphane, yazı tipi ya da CDN kullanılmaz; arayüz Windows'ta hazır gelen Bahnschrift ve Segoe UI yazı tiplerini kullanır.

`tools/build_html.py` yalnızca Python standart kütüphanesiyle çalışır ve `src/pafta.src.html` içindeki yer tutucuları doldurur:

| Yer tutucu | İçerik |
|---|---|
| `/*__WORLD__*/` | `data/world.json`: kara, göller, ülke sınırları, şehirler |
| `/*__FIR__*/` | `data/fir.json`: FIR sınırları ve adları |
| `/*__TR__*/` | `data/turkey.json`: Türkiye sınırı (1:10m) |
| `/*__MV__*/` | `data/mavivatan.json`: Mavi Vatan dış sınırı |
| `/*__ADM__*/` | `data/tr_idari.json`: il ve ilçe sınırları, adları, etiket noktaları |
| `/*__KD__*/` | `data/kara_detay.json`: Türkiye ve çevresi için 1:10m kara ve göller |
| `/*__UYDU__*/` | `data/uydu_doseme.json`: yaklaştıkça netleşen uydu döşemeleri (z6–z8) |
| `/*__SAT__*/` | `data/bluemarble.jpg`, base64 |
| `/*__APP__*/` | `src/app.js` + `src/moduller/*.js` (ada göre sıralı; `/*__VER__*/` → `VERSION`) |

Bütün kod tek bir `<script>` içinde çalışır. `draw()` modül kodu çalışmadan önce de çağrıldığı için modüllerin çizimde kullandığı durum değişkenleri `var` ile, yardımcıları `function` bildirimiyle tanımlanır (`let`/`const` geçici ölü bölgesine düşmemek için). Modüller app.js'deki `projeTopla`, `projeYukle`, `degisti`, `katmanlariTemizle` gibi fonksiyonları sararak genişletir.

| Modül | İçerik |
|---|---|
| `05_koordinat.js` | UTM ve MGRS (Krüger serisi; pyproj'a göre < 0,1 mm), gösterim biçimleri (`fk`), ortak koordinat bulucu (`koordBul`), imleç göstergesi |
| `08_xlsx.js` | Bağımlılıksız `.xlsx` okuma (ZIP + saf JS inflate + XML) ve yazma (sıkıştırmasız ZIP) |
| `10_uydu_doseme.js` | Web Mercator döşeme çizici; kaynak arayüzü `{ad, zmin, zmax, var(k), gorsel(k)}` |
| `12_uydu_paketi.js` | `.paftauydu` uydu paketi: tarayıcıda `File.slice`, exe'de yerel sunucu |
| `20_notam.js` | NOTAM / NAVTEX metninden alan, daire ve nokta çıkarma |
| `22_excel_al.js` | Dosyadan al: metin ve Excel; sütun eşleştirme penceresi |
| `25_kerteriz.js` | Vincenty doğru problemi; kerteriz ve mesafeyle konum |
| `30_rapor.js` | İlçe poligonları, `ilIlceBul`, alan raporu ve Excel çıktısı |
| `35_notlar.js` | Notlar ve oklar |
| `40_duzenle.js` | Haritada sürükleyerek düzenleme, geri al / yinele |
| `45_baski.js` | Ölçekli PDF baskı (bağımlılıksız PDF yazıcı, JPEG gömülü) |

`src/pafta.src.html` içindeki ana bölümler (`/* ============ ... ============ */` başlıklarıyla ayrılmıştır):

| Bölüm | İçerik |
|---|---|
| koordinat ayrıştırma | DMS, boşluklu DMS, NOTAM bitişik, NAVTEX derece-dakika ve ondalık biçimler; bölge/nokta tablosu; her nokta satır numarasını ve koordinatın satırdaki konumunu (`li`, `cs`, `ce`) taşır |
| görünüm / projeksiyon | Mercator ve eş uzaklıklı silindirik; yumuşak kamera geçişleri |
| taban harita | Kara, göller, sınırlar (bölge ölçeğinde 1:10m kıyıya geçiş), FIR (etiket yerleşimi FIR poligonunun görünen kısmının içinde), uydu zemini |
| il ve ilçe sınırları | Ölçeğe göre seviye (metre/piksel eşikleri `ADM` sabitinde), alan sırasına göre etiket yerleşimi |
| kılavuz, çerçeve, ölçek | Dereceli çerçeve, km ve NM çift ölçek çubuğu |
| 1 · alanlar / 2 · daireler | Küresel alan ve çevre; jeodezik halkalar |
| 3 · sınırdan mesafe | Eş uzaklıklı azimutal projeksiyonda ızgara, birleşim maskesi, tam Öklid mesafe dönüşümü (Felzenszwalb), marching squares, kapalı eğrilere birleştirme |
| 4 · noktalar / 5 · ölçüm | İşaretler, etiket çakışma kontrolü; Vincenty ters problemi, büyük daire yayı |
| lejant, künye, bulduru | Pafta öğeleri |

### Proje dosyası (`.pafta`)

```json
{
  "uygulama": "PAFTA", "surum": 1, "kayit": "2026-10-02T18:40:00Z",
  "form": { "input": "Örnek alan A\t1\t42°30'00\"K ...", "r-mv": true, "r-dist": "200, 500", "opt-sat": false, "t-title": "Örnek pafta" },
  "alanlar":  [ { "ad": "Örnek alan A", "renk": "#c8156f", "gorunur": true } ],
  "daireler": { "150 km": "#c8156f", "300 km": "#2f4b9a" },
  "mesafe":   [ "#b3541e", "#6a3d9a" ],
  "noktalar": [ { "ad": "Ankara", "enlem": 39.916667, "boylam": 32.85, "renk": "#b3541e" } ],
  "olcum":    [ { "renk": "#d1495b", "noktalar": [ { "enlem": 41.0136, "boylam": 28.9761, "ad": "İstanbul" } ] } ],
  "notlar":   [ { "tur": "not", "metin": "Tatbikat", "enlem": 43.35, "boylam": 29.2, "renk": "#a4123f", "boyut": 13 },
                { "tur": "ok", "bas": { "enlem": 44.0, "boylam": 36.2 }, "uc": { "enlem": 42.75, "boylam": 33.9 }, "metin": "", "renk": "#16222a", "boyut": 13 } ],
  "gorunum":  { "projeksiyon": "mercator", "latMin": 33.5, "lonMin": 22.5, "latMax": 45.5, "lonMax": 45.5 }
}
```

- `form`, paneldeki bütün giriş alanlarının değerleridir (anahtar: öğe kimliği). Alanlar, daireler ve mesafe eğrileri açılışta bu girdilerden **yeniden hesaplanır**; dosyada yalnızca renk ve görünürlük gibi kullanıcı seçimleri saklanır.
- `alanlar`, `daireler`, `mesafe` boşsa `null`'dır; o katman çizilmemiş demektir.
- Noktalar, ölçüm hatları ve notlar olduğu gibi saklanır. `notlar` alanı v2.0'da eklendi; eski sürümler onu yok sayar, v2.0 notsuz dosyaları sorunsuz açar.

### Uydu paketi (`.paftauydu`)

```
"PAFTAUYDU1"        10 bayt
uint32 (LE)         dizin uzunluğu
JSON dizin          {"surum":1, "ad", "atif", "lisans", "zmin", "zmax", "kapsam":[b,g,d,k],
                     "doseme": {"z/x/y": [konum, uzunluk], ...}}      konum: veri bölümünün başından
veri                JPEG/PNG döşemeler arka arkaya (Web Mercator, 256 px)
```

Dosya hiçbir zaman bütünüyle belleğe alınmaz. Tarayıcıda `File.slice` ile yalnız istenen döşeme okunur; exe'de `desktop/uydu.go` paketi açık tutar, döşemeleri `/<jeton>/__uydu/z/x/y` adresinden `ReadAt` ile verir ve son paketin yolunu ayarlarda saklar. Paket kaynağı gömülü NASA döşemelerinin üstüne, aynı çizim kuralıyla eklenir.

## Masaüstü (exe) sürümü

`desktop/` klasörü, aynı HTML'i bir Windows penceresinde gösteren küçük bir Go programıdır:

- **[go-webview2](https://github.com/jchv/go-webview2):** Saf Go, CGO gerektirmez. Windows'taki Edge WebView2 motorunu kullanır. Exe ~16 MB'tır (9 MB'ı gömülü HTML: harita verisi ve uydu görüntüsü).
- HTML `go:embed` ile exe'ye gömülür ve yalnızca `127.0.0.1` üzerinden, rastgele bir jetonlu adreste sunulur.
- `desktop/shim.js` sayfaya `window.masaustu` arayüzünü sağlar; Go tarafındaki `native*` fonksiyonlarına bağlanır:
  - Uydu paketi seçme, hatırlama ve sunma (`desktop/uydu.go`)
  - Windows **Aç / Farklı kaydet** pencereleri; dosya okuma ve yazma (yarım yazmaya karşı geçici dosya + yeniden adlandırma)
  - Son açılanlar, kurtarma kaydı ve ayarlar: `%LOCALAPPDATA%\PAFTA`
  - Pencere başlığı ve kaydedilmemiş değişiklik bayrağı; kapatma isteğinde arayüzün kendi soru penceresi
  - PNG / PDF / KML / GeoJSON / CSV / XLSX indirmeleri (`<a download>`) yakalanır ve Windows kaydetme penceresine yönlendirilir
- Pencere görünümü: koyu başlık çubuğu (Windows 11'de araç şeridiyle aynı renk), açılışta beyaz parlama yerine uygulamanın koyu zemini, son pencere boyutu ve konumu.
- Menü çubuğu yoktur; dosya işlemleri **Çıktı → Proje** bölümünde ve kısayollardadır.
- HTML `window.masaustu`'yu bulamazsa tarayıcı moduna döner. `app/pafta.html` iki sürüm için de tek kaynaktır.

## Derleme

### HTML

```sh
python tools/build_html.py
```

### Exe

Gereksinim: Python 3, [Go 1.22+](https://go.dev/dl/) ve ilk derlemede bağımlılıkları indirmek için internet.

**Windows:**
```bat
desktop\build.bat
```

**Linux / macOS (çapraz derleme):**
```sh
./desktop/build.sh
```

Çıktı: `dist/PAFTA.exe`. Betik önce HTML'i derler, `desktop/app.html` olarak kopyalar, sonra exe'yi üretir.

`desktop/rsrc_windows_amd64.syso` derlemeye otomatik dahil olur ve şunları taşır: çok boyutlu uygulama ikonu, Türkçe sürüm bilgisi, yönetici izni istemeyen (`asInvoker`), DPI farkındalıklı ve Common Controls 6 bildirimi (manifest). İkon, sürüm (`VERSION`) ya da `desktop/app.manifest` değiştiğinde `tools/make_resource.sh` ile yeniden üretin (LLVM `llvm-windres` ya da mingw-w64 `windres` gerekir).

## Verileri yeniden üretme

`data/` klasöründeki dosyalar depoda hazır durur; aşağıdakiler yalnızca kaynak veriler güncellenmek istendiğinde gerekir.

```sh
cd tools/veri
./indir.sh             # Natural Earth ve VATSpy ham verileri -> tools/veri/ham/
python dunya.py        # data/world.json
python fir.py          # data/fir.json
python turkiye.py      # data/turkey.json
python kara_detay.py   # data/kara_detay.json
python il_ilce.py      # data/tr_idari.json (il/ilçe sınır zincirleri ve ilçe poligonları)
python uydu_doseme.py  # data/uydu_doseme.json (NASA Blue Marble döşemeleri, GitHub'dan)
python mavi_vatan.py   # data/mavivatan.json (numpy, scipy, matplotlib, scikit-image gerekir)
```

`dunya.py`, `turkiye.py`, `kara_detay.py`, `il_ilce.py` ve `mavi_vatan.py` güncel kaynaklardan birebir aynı dosyaları üretir. VATSpy verisi VATSIM ağı için sık güncellenir ve gerçek ICAO yapısından ayrışabilir (ör. Çin FIR'ları); `fir.py` çıktısını kullanmadan önce Türkiye ve çevresindeki FIR'ları karşılaştırın.

Uydu görüntüsü NASA Blue Marble Next Generation'ın 5400×2700 eşdikdörtgen sürümüdür (`basemap-data` Python paketindeki `bmng.jpg`). Yaklaşınca üstüne çizilen döşemeler (`uydu_doseme.json`) NASA GIBS Blue Marble Shaded Relief & Bathymetry katmanının [FreeTiler](https://github.com/freetiler/nasa-bluemarble) aynasından alınır: z6–z7 bölge kutusu (17,5°–52°D, 28°–48,5°K), z8 Türkiye.

## Testler

Depoda otomatik test paketi yoktur; geliştirme sırasında Playwright (Chromium) ile şu denetimler yapıldı: UTM/MGRS ve Vincenty doğru/ters problemi pyproj ve `mgrs` paketine karşı; ilçe sorgusu ham geoBoundaries poligonlarına karşı (1500 rastgele noktada %99,5 aynı ilçe, farklar sadeleştirilmiş sınırlarda); `.xlsx` okuma/yazma openpyxl ve LibreOffice'e karşı; PDF poppler (`pdfinfo`, `pdftoppm`) ile; proje dosyası gidiş-dönüşü; sahte `native*` fonksiyonları ve Go uçlarının Python taklidiyle masaüstü köprüsü; `desktop/uydu.go` Linux'ta Go birim testiyle.

## Yayınlama (GitHub Releases)

Exe dosyası depoya eklenmez (`.gitignore`), **Releases** üzerinden dağıtılır:

1. `VERSION` dosyasını ve `CHANGELOG.md`'yi güncelleyin; gerekirse `tools/make_resource.sh`.
2. `desktop/build.bat` ile exe'yi derleyin.
3. GitHub'da depo sayfası → **Releases** → **Draft a new release**; etiket olarak sürüm numarası (ör. `v2.0.0`).
4. `dist/PAFTA.exe` ve `app/pafta.html` dosyalarını sürükleyip **Publish release** deyin.
