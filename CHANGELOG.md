# Değişiklik Günlüğü

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
