# Değişiklik Günlüğü

## v2.5.0 — 2026-10-21

**Çok sayıda veriyle hız** (26.000 nokta + 300 alan + 3.000 köşeli ölçüm hattıyla denendi; tam görünümde bir kare 830 ms → ~70 ms, yakın görünümde 290 ms → ~40 ms; yalnız 26.000 noktayla 700 ms → ~40 ms)
- **Nokta çizimi:** Aynı renkteki noktalar tek yolda çizilir; ekranda üst üste binen işaretler (çok sıkışık görünümde) tek çizilir. Nokta adlarının genişliği önbelleğe alınır. Etiketler için boş yer bulunamayan sıkışık görünümde adlar atlanır (az nokta varken ad yine de yazılır).
- **Etiket çakışma denetimi** ızgara dizinli oldu; binlerce etiket artık karesel iş çıkarmıyor.
- **Ölçüm hatları:** Her parçanın büyük daire noktaları, mesafesi ve kerterizi bir kez hesaplanıp önbelleğe alınır (nokta sürüklenene kadar); ekran dışındaki parçalar çizilmez, ekranda 22 pikselden kısa kalan parçalara mesafe etiketi konmaz, birbirine çok yakın köşe numaraları atlanır.
- Şehir adlarının nokta üstüne binmemesi, imleç yapışması ve sürükleme tutamacı aramaları hızlandı.
- **Lejant** en çok 12 alan ve 8 ölçüm hattı yazar; fazlası "+ 288 alan daha" satırıyla özetlenir (yüzlerce alanda lejant ekrana sığmıyordu).

**Panel**
- **Nokta listesi kendi kutusunda kaydırılır ve sanaldır:** yalnız görünen satırlar oluşturulur, 26.000 noktada sekme değiştirmek ve listeyi kaydırmak akıcıdır. Başlık, girdi alanı ve işaret seçenekleri yerinde kalır; liste kalan yüksekliği doldurur.
- **Nokta araması:** listenin üstündeki kutu ad ya da koordinata göre süzer.
- **Ölçüm listesi** de aynı şekilde sanal ve kaydırılabilir; yeni nokta eklenince liste sonuna kayar.
- Alan, daire, mesafe eğrisi ve not listeleri uzayınca kendi kutularında kaydırılır.
- İşaret ayarları (şekil, boyut, renk) tek satıra toplandı; nokta girdi alanı küçüldü.

## v2.4.0 — 2026-10-16

- **Dosya menüsü:** Araç çubuğunda **Dosya** düğmesi (sol üstteki işaret de açar): Yeni pafta, Aç, son açılanlar (masaüstü), Kaydet, Farklı kaydet, PDF olarak kaydet (geçerli baskı ayarlarıyla), PDF ayarları, PNG, KML, GeoJSON, CSV ve tema.
- **Tarayıcıda yerinde aç ve kaydet:** Edge ve Chrome'da `.pafta` dosyası Windows'un aç/kaydet penceresiyle açılır; **Kaydet** aynı dosyanın üzerine yazar, **Farklı kaydet** yeni dosya seçtirir. Bu özelliği olmayan tarayıcılarda kayıt eskisi gibi indirmedir.
- **Çoklu dosya içe aktarma:** Dosyadan al ve sürükle-bırakta birden çok dosya seçilebilir. Metin ve CSV dosyaları tek listede birleşir (adı olmayan alan, dosya adını alır); Excel ve KML dosyalarının pencereleri sırayla açılır.
- **Koordinatlarla çizgi:** Notlar → Çizgi kipinde sıralı koordinat listesi; **Çizgileri çiz** her grubu bir çizgi yapar. Liste Alanlar biçimindedir; **Dosyadan al** ile metin, CSV, Excel ya da KML'den doldurulur, **Haritadan seç** ile köşe eklenir. Köşeler sürüklenince yeni koordinat listeye yazılır; liste projeye kaydedilir. Excel penceresine "Çizgiler" hedefi eklendi.
- **Eğri çizgi:** Çizgi ayarlarında **Eğri** seçeneği; çizgi verilen bütün noktalardan geçen yumuşak bir eğri (Bezier) olarak çizilir. Listedeki eğri düğmesiyle her çizgi ayrı ayrı eğri ya da köşeli yapılabilir; uzunluk eğri üzerinden hesaplanır.
- **Açık / koyu tema:** Görünüm → **Arayüz teması** ya da Dosya menüsünden. Panel, araç şeridi ve listeler açık renge geçer; harita ve pencereler aynı kalır. Seçim bu bilgisayarda hatırlanır, projeye yazılmaz.
- Arayüzdeki gölgeler kaldırıldı; araç çubuğu ve yakınlaştırma düğmeleri ince çerçeveli.
- Alan adları vurgu çerçevesinin üstünde kalır.

## v2.3.0 — 2026-10-14

**Harita**
- **Akıllı alan etiketleri:** Alan adı köşelerin ortalamasına değil, poligonun içinde kenara en uzak noktaya yazılır (L ya da hilal biçimli alanlarda da içeride kalır). Alan ekrandan taşıyorsa görünen parçanın içine yerleşir; başka bir yazıyla çakışırsa yakına kayar, yer yoksa yine de yazılır.
- **Alan stilleri:** Her alan için **dolgu** (düz, tarama, çapraz tarama, dolgusuz) ve **sınır** (düz, kesikli, **taraklı**: ICAO kısıtlı saha gösterimi, dişler içe dönük). Alan listesindeki stil düğmesiyle seçilir; `.pafta` dosyasına kaydedilir, PNG ve PDF'e basılır.
- **Dolgu yoğunluğu:** Görünüm bölümünde sürgü; alanlar, daireler ve mesafe bantları için.
- **Bağımsız kuzey oku:** Künye gizliyken haritanın sağ altında, bulduru haritasının yanında sade bir kuzey oku.
- **Bulduru haritası:** Komşu ülke sınırları ve ince koordinat kılavuzu.

**Panel**
- Listelerdeki *gizle, göster, odak, sil* düğmeleri ikon oldu (üzerine gelince adı görünür; sil düğmesi ayrık durur).
- **Listeden haritaya vurgu:** Alan, daire, nokta, ölçüm ve not satırlarının üzerine gelince öğe haritada turuncu çerçeveyle gösterilir.
- **Sekme rozetleri:** Araç şeridinde her araçtaki öğe sayısı.
- Koordinat göstergesinde anlık ölçek (`1 : 2.470.000`).
- "Bölgeleri çiz" yeniden çalıştırıldığında aynı adlı alanların rengi, görünürlüğü ve stili korunur.

**Diğer**
- Kullanılmayan eski ölçek çubuğu kodu kaldırıldı.

## v2.2.1 — 2026-10-14

- **Bitişik koordinatlarda sıfırsız boylam:** `413015N, 324530E` ve `4130N, 3245E` gibi, boylamın baştaki sıfırı yazılmamış (100°'den küçük boylamlarda 4 ya da 6 basamak) koordinatlar artık bütün araçlarda okunur. Noktalarda `Tepe 1 413015N, 324530E #d62828`, `Tepe 2 413015N, 324530E` ve `413015N, 324530E` satırlarının üçü de geçerlidir. Dakikası ya da saniyesi 60'ı aşan bitişik sayılar koordinat sayılmaz.

## v2.2.0 — 2026-10-14

- **KML / KMZ'den al:** Google Earth dosyaları (`.kml`, `.kmz`) **Dosyadan al** düğmesiyle ya da haritaya sürüklenerek içe aktarılır. Poligonlar alan, noktalar nokta, çizgiler Notlar'da çizgi olur; daireye benzeyen kapalı şekiller merkez ve yarıçapıyla daire olarak tanınır. Önizlemede her öğenin nereye ekleneceği (alan, daire, nokta, not, çizgi, ölçüm hattı ya da alma) tek tek ya da türe göre topluca seçilir. Renkler KML stillerinden (StyleMap dahil) alınır; 400'den çok köşeli şekiller sadeleştirilir; klasörler ve MultiGeometry açılır.
- PAFTA'nın kendi KML çıktısı geri okunduğunda alanlar, daireler (yarıçaplarıyla), noktalar ve ölçüm hatları aynen geri gelir.
- Alanlar listesinde boş satırdan sonra aynı bölge adı yeni bir bölge başlatır (önceden üstteki bölgeye ekleniyordu).

## v2.1.0 — 2026-10-13

- **Nokta adlarını göster / gizle:** Noktalar → İşaret bölümünde anahtar; kapalıyken yalnız işaretler çizilir (koordinat etiketi açıksa yalnız koordinat yazar). Seçim projeye kaydedilir.
- **Çizgi:** Notlar sekmesinde yeni **Çizgi** kipi; tıklayarak çok köşeli çizgiler, düz / kesikli / noktalı tip, üç kalınlık, isteğe bağlı etiket. Köşeler sürüklenerek taşınır; geri al / yinele ve PDF baskıda yer alır; `.pafta` dosyasında `notlar` içinde `tur: "cizgi"` olarak saklanır.

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
