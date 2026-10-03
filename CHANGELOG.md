# Değişiklik Günlüğü

## v2.0.0 — 2026-10-03

**Veri girişi**
- **Koordinat biçimleri:** ondalık dakika, NOTAM bitişik (`4230N 03015E`, `423000N0301500E`), NAVTEX derece-dakika (`42-30.50K 030-15.00D`), **UTM** ve **MGRS** okunur. Görünüm → **Koordinat biçimi** ile listeler, etiketler, gösterge ve araçların yazdığı koordinatlar DMS, ondalık dakika, ondalık derece, UTM ya da MGRS olur. CSV'ye UTM ve MGRS sütunları eklendi.
- **Metinden al:** NOTAM ve NAVTEX metinlerinden alanlar, yarıçaplı daireler ve noktalar; irtifa sınırı ada eklenir, önizlemeden seçilerek eklenir.
- **Excel'den al:** `.xlsx` dosyaları sütun eşleştirme penceresiyle Alanlar, Noktalar ve Daireler'e. Noktalar ve Daireler'e de **Dosyadan al** düğmesi; `.xlsx` haritaya sürüklenebilir. Okuyucu ve yazıcı bağımlılıksızdır.
- **Kerteriz ve mesafeyle konum:** bir koordinattan ya da haritadaki bir addan "045°, 120 NM" ile noktalar, alan köşeleri, daire merkezleri ya da ölçüm hattı; zincirleme hesap (Vincenty doğru problemi).
- Daireler: satır sonundaki yarıçap (`… 10 NM`) yalnız o merkeze uygulanır.

**Analiz**
- **Alan raporu:** alan, çevre, ağırlık merkezi, FIR'lar, Türkiye karası yüzdesi, il/ilçe dağılımı, Türkiye'ye en kısa mesafe, Mavi Vatan içindeki pay ve alanlar arası en kısa mesafe; Excel'e aktarma (Alanlar, Köşeler, Mesafeler sayfaları).
- **İmleç göstergesi** Türkiye içinde il ve ilçeyi yazar (ilçe poligonları `tr_idari.json`'a eklendi).

**Harita**
- **Uydu görüntüsü yaklaştıkça netleşir:** gömülü NASA Blue Marble döşemeleri (bölge ~1 km, Türkiye ~500 m/piksel); künyedeki "Zemin" satırı çözünürlüğü yazar.
- **Uydu paketi (`.paftauydu`):** internete bağlı bir bilgisayarda `tools/uydu_paketi.py` ile hazırlanan Sentinel-2 cloudless döşemeleri (10–30 m) çevrimdışı açılır; exe son paketi hatırlar, kaynağın atfı paftaya basılır.
- **Notlar ve oklar** aracı (yeni sekme, `Ctrl+6`); projeye kaydedilir.
- **Haritada sürükleyerek düzenleme:** alan köşeleri, noktalar, daire merkezleri, ölçüm noktaları, notlar ve ok uçları; yeni koordinat listedeki satıra yazılır.
- **Geri al / yinele:** `Ctrl+Z` / `Ctrl+Y` ve araç çubuğunda; son 60 adım.

**Çıktı**
- **Ölçekli PDF baskı:** A4/A3, yatay/dikey, sabit ölçek (ör. 1:250.000) ya da ekrana sığdır, 150–300 dpi; haritada sayfa çerçevesi önizlemesi.

**Diğer**
- Araç kısayolları `Ctrl+1` … `Ctrl+8` (Notlar eklendi).
- `.pafta` dosyasına `notlar` alanı eklendi; v1 dosyaları olduğu gibi açılır.

## v1.2.0 — 2026-10-03

- **Haritadan seç:** Alanlar, Daireler, Noktalar ve kendi Mavi Vatan koordinatlarınızın listesinin yanında, renk seçicideki damlalık gibi çalışan bir konum seçici. Düğmeye basıp haritaya tıklayınca o yerin koordinatı (DMS) listeye eklenir ve çizim anında güncellenir. İmleç noktalara, alan köşelerine ve daire merkezlerine yapışır; `Esc` ya da "Bitti" ile biter. Alanlarda listeye boş satır eklemek yeni bir alan başlatır.

## v1.1.0 — 2026-10-03

- **İl ve ilçe sınırları:** Türkiye'ye yaklaştıkça önce 81 ilin sınırları ve adları, daha yakında 973 ilçenin sınırları ve adları görünür (OpenStreetMap, geoBoundaries üzerinden). İl sınırları ilçe sınırlarından türetildiği için birebir çakışır; merkez ilçe adları resmî biçimdedir ("Çanakkale Merkez"). Görünüm → "İl ve ilçe sınırları, adları" ile kapatılabilir.
- **Ayrıntılı kıyı:** Türkiye ve çevresinde yaklaşınca taban harita 1:50m yerine 1:10m kara ve göllere geçer (ör. İstanbul Boğazı ve Haliç, Ege adaları).
- FIR adları artık kullanıcı katmanlarından ve il/ilçe adlarından sonra yer bulur; yakın ölçekte ilçe adlarını kapatmaz.

## v1.0.0 — 2026-10-02

İlk yayımlanan sürüm.

**Araçlar**
- Alanlar: koordinat listesinden kapalı bölgeler; küresel alan ve çevre; DMS, boşluklu DMS ve ondalık biçimler
- Daireler: bir veya birden fazla merkezden, birden fazla yarıçapta jeodezik halkalar (km / NM)
- Sınır mesafesi: Türkiye kara sınırı ve kıyısından eşit uzaklık eğrileri; isteğe bağlı Mavi Vatan (gömülü medyan hat rekonstrüksiyonu ya da kendi koordinatlarınız), mesafenin Mavi Vatan'dan mı TR sınırından mı ölçüleceği seçilebilir
- Noktalar: isimli konumlar, beş işaret şekli, nokta başına renk
- Ölçüm: haritaya tıklayarak çok parçalı hatlar; WGS84 / Vincenty mesafe ve kerteriz, hat toplamı, noktalara yapışma

**Pafta**
- Dereceli çerçeve ve koordinat kılavuzu, km ve NM çift ölçek çubuğu, lejant
- Pafta künyesi: başlık, alt satır, ölçek, projeksiyon, datum, tarih, kuzey oku
- Bulduru haritası
- Uydu görüntüsü (NASA Blue Marble NG), dünya geneli FIR sınırları ve adları, ülke sınırları, şehirler
- Mercator ve eş uzaklıklı silindirik projeksiyon; yumuşak kamera geçişleri

**Proje ve çıktı**
- `.pafta` proje dosyası: girdiler, renkler, ölçümler ve harita görünümü; sürükle-bırak ile açma
- Koordinat listesini haritaya sürükleyip açık araca yükleme
- PNG (1×, 2×, 3×), KML, GeoJSON, CSV
- Kısayollar ve veri kaynakları penceresi (`F1`), açılış ekranı

**Masaüstü sürümü**
- Kurulumsuz Windows exe (Go + WebView2, ~11 MB), çok boyutlu ikon ve sürüm bilgisi
- Koyu başlık çubuğu, açılışta koyu zemin, pencere boyutu ve konumunun hatırlanması
- Windows aç/kaydet pencereleri, son açılanlar, kaydedilmemiş değişiklik uyarısı, kurtarma kaydı, exe'ye sürükle-bırak ile açma
