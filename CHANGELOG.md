# Değişiklik Günlüğü

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
