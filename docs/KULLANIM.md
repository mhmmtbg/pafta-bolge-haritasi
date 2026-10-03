# Kullanım

## Koordinat biçimleri

Bütün araçlar aynı ayrıştırıcıyı kullanır. Tablolar Excel veya Word'den olduğu gibi yapıştırılabilir; sekme, noktalı virgül, virgül ve boşluk ayraç olarak kabul edilir.

| Biçim | Örnek |
|---|---|
| Derece‑dakika‑saniye | `41°30'15"K  30°15'00"D`, saniyede ondalık: `41°30'15,4"K` |
| Derece, ondalık dakika | `41°30,25'K  30°15,5'D` |
| Boşluklu DMS (yön harfi zorunlu) | `41 30 15 K  30 15 00 D` |
| Ondalık derece | `41.5042  30.25`, `41,5042  30,25`, `41.50420°K 30.25000°D` |
| NOTAM (bitişik) | `4130N 03015E`, `413015N0301500E`, `4130.2N 03015.5E` |
| NAVTEX (derece-dakika) | `41-30.25K 030-15.50D`, `41 30.25N 030 15.50E` |
| UTM | `36S 487182 4419444` |
| MGRS | `36S VK 87182 19443` (2–10 basamak) |

- Yön harfleri: **K/G/D/B** ve **N/S/E/W**. Yön harfi yoksa ilk sayı enlem, ikinci sayı boylam kabul edilir.
- Sırası ters yazılmış çiftler (önce boylam) yön harflerinden anlaşılır.
- Okunamayan satırlar listenin altında satır numarasıyla gösterilir.

**Gösterim biçimi:** Görünüm → **Koordinat biçimi** ile listelerde, etiketlerde, imleç göstergesinde ve araçların listeye yazdığı koordinatlarda kullanılacak biçim seçilir: derece-dakika-saniye, ondalık dakika, ondalık derece, UTM ya da MGRS. CSV çıktısında UTM ve MGRS sütunları her zaman bulunur.

**İmleç göstergesi:** Haritanın altındaki gösterge imlecin koordinatını seçili biçimde yazar; Türkiye içindeyse il ve ilçeyi de gösterir.

## Haritadan seç

Alanlar, Daireler ve Noktalar listelerinin başlığında (ve Mavi Vatan için kendi koordinatlarınız seçildiğinde) **Haritadan seç** düğmesi vardır. Renk seçicideki damlalık gibi çalışır:

1. Düğmeye basın; düğme turuncu olur, imleç artıya döner ve imlecin koordinatı yanında görünür.
2. Haritaya her tıklama, o yerin koordinatını listeye yeni bir satır olarak ekler ve çizim hemen güncellenir. Haritayı sürüklemek nokta eklemez.
3. İmleç 10 piksel içindeki noktalara, alan köşelerine ve daire merkezlerine yapışır; adı yanında yazar.
4. `Esc`, **Bitti** ya da düğmeye yeniden basmak seçimi bitirir.

Alanlarda her tıklama son alana yeni bir köşe ekler; listeye boş bir satır eklerseniz sonraki tıklamalar yeni bir alan başlatır. Noktalar "Nokta 1, Nokta 2…", daire merkezleri "Merkez 1…" diye adlandırılır; adları listede değiştirebilirsiniz.

## Metinden al (NOTAM, NAVTEX)

Alanlar bölümündeki **Metinden al** düğmesi bir pencere açar. NOTAM, NAVTEX ya da koordinat içeren herhangi bir metni yapıştırın:

- Art arda gelen üç ya da daha çok koordinat **alan** olur. Boş satır ya da ilk köşeye dönen bir dizi alanı kapatır; `AREA A`, `ALAN B`, `SAHA 3` gibi başlıklar alanın adı olur.
- `WI 10NM RADIUS OF …`, `10NM RADIUS CENTERED ON …`, `… merkezli 5 deniz mili yarıçaplı` gibi ifadeler **daire** olur.
- Tek başına kalan koordinatlar **nokta** olur.
- `F) SFC  G) FL200` gibi irtifa sınırları alan ve daire adlarına eklenir. `Q)` satırı yok sayılır; tarih ve saatler koordinat sanılmaz.

Önizlemede bulunanlar listelenir; istemediklerinizin işaretini kaldırıp **Seçilenleri ekle** deyin. Alanlar Alanlar listesine, daireler Daireler listesine (yarıçaplarıyla), noktalar Noktalar listesine eklenir.

## Dosyadan al ve Excel

Alanlar, Daireler ve Noktalar bölümlerindeki **Dosyadan al** düğmesi metin (`.txt`, `.csv`) ve Excel (`.xlsx`) dosyalarını okur. Dosyayı haritaya sürükleyip bırakmak da aynı işi yapar (açık bölüme yüklenir).

Excel dosyası seçildiğinde **sütun eşleştirme** penceresi açılır:

1. Birden çok sayfa varsa sayfayı seçin.
2. Sütunlar başlıklarından (`Bölge`, `Nokta`, `Enlem`, `Boylam`, `MGRS`, `Yarıçap`, `Renk`…) ya da içeriklerinden tahmin edilir; gerekirse elle değiştirin. Koordinat tek bir sütunda da olabilir (MGRS, UTM ya da `41°30'K 29°15'D`): Boylam sütununu "—" bırakın.
3. Önizleme tablosunda her satırın okunan koordinatı görünür; okunamayan satırlar atlanır.
4. **Ekle**: satırlar seçilen listeye eklenir (ya da **Mevcut listeyi değiştir** ile onun yerine yazılır) ve çizilir.

Aynı bölge adının her satırda tekrarlandığı tablolar tek alan olarak okunur. Daireler için yarıçap sütununda yalnız sayı varsa seçilen birim eklenir. Eski `.xls` biçimi okunmaz; Excel'de `.xlsx` olarak kaydedin.

## Kerteriz ve mesafeyle konum

Alanlar, Daireler ve Noktalar listelerinin başlığındaki pusula düğmesi, bir başlangıçtan **gerçek kerteriz ve mesafeyle** yeni konumlar üretir ("Ankara'dan 045°, 120 NM").

- **Başlangıç:** bir koordinat ya da haritadaki bir noktanın, alan köşesinin ("Örnek alan A 2"), daire merkezinin veya ölçüm noktasının adı. Öneriler listeden seçilebilir.
- **Kerteriz ve mesafe:** her satır bir konum: `045 120`, `090/80 NM  Doğu noktası`, `135° 60 km`. Birim yazılmazsa varsayılan birim kullanılır; satır sonundaki metin konumun adı olur.
- **Her satır bir öncekinin varışından başlasın:** rota ya da poligon kenarı gibi zincirleme hesap.
- **Ekleneceği yer:** Noktalar, yeni bir alan (köşeler sırayla; ör. bir sektör), daire merkezleri ya da ölçüm hattı.

Hesap WGS84 elipsoidi üzerinde Vincenty doğru problemiyle yapılır; sonuçlar listeye saniyenin onda biri hassasiyetle yazılır.

## Araçlar

Sol şeritteki araçlar birbirinden bağımsız katmanlar üretir; hepsi aynı anda haritada durabilir. Katmanlar **Görünüm** bölümünden tek tek gizlenir.

### Alanlar

Her satır: `bölge adı, nokta no, enlem, boylam`.

```
Örnek alan A	1	42°30'00"K	30°30'00"D
	2	42°41'30"K	32°12'00"D
	3	42°16'00"K	33°24'30"D
```

- Bölge adı boş bırakılan satırlar üstteki bölgeye eklenir; boş satır yeni bir bölge başlatır (adsız bölgeler "Bölge 2", "Bölge 3" diye adlandırılır).
- **Dosyadan al** ile `.txt`, `.csv` ya da `.xlsx` dosyası yüklenebilir; **Metinden al** NOTAM ve NAVTEX metinlerini okur.
- Listede her bölgenin nokta sayısı, alanı ve çevresi yazar; renk kutusuna tıklayarak rengi değiştirin, **gizle** ve **odak** ile tek bölgeyle çalışın.

#### Alan raporu

Listenin altındaki **Alan raporu** her alan için şunları hesaplar:

- alan, çevre (km ve NM), köşe sayısı, ağırlık merkezi;
- içinden geçtiği **FIR**'lar ve yüzdeleri;
- Türkiye karasında kalan yüzde ve **il / ilçe** dağılımı;
- karaya değmiyorsa **Türkiye'ye en kısa mesafe** (km ve NM);
- **Mavi Vatan** içinde kalan yüzde (Sınır mesafesi bölümünde kendi koordinatlarınız seçiliyse onlarla);
- birden çok alan varsa **alanlar arası en kısa mesafe** tablosu (kesişen alanlar "kesişiyor").

Yüzdeler alanın içine yayılan düzenli örnek noktalardan hesaplanır. **Excel'e aktar** raporu üç sayfalı bir `.xlsx` dosyası olarak verir: Alanlar (özet), Köşeler (DMS / ondalık / UTM / MGRS) ve Mesafeler.

### Daireler

Her satır bir merkezdir (`ad, enlem, boylam`); yarıçaplar virgülle yazılır (`100, 250, 500`) ve hepsi her merkeze uygulanır. Birim kilometre ya da deniz milidir. Bir merkeze yalnız kendi yarıçapını vermek için satırın sonuna yazın: `Merkez 2  41°K 29°D  10 NM`. Halkalar küre üzerinde gerçek sabit uzaklık eğrisi olarak çizilir.

### Sınır mesafesi

Mesafeleri virgülle yazın ve **Eğrileri çiz** deyin. Eğriler Türkiye kara sınırından ve kıyısından ölçülür.

**Mavi Vatan'ı hesaba kat** açıldığında:

- **Mesafeler nereden ölçülsün?** Mavi Vatan dış sınırından ya da Türkiye kara sınırından. Seçilmeyen sınır haritada kesikli çizgiyle gösterilir.
- **Mavi Vatan sınırı:** Gömülü rekonstrüksiyon (medyan hat kuralıyla üretilmiş) ya da kendi koordinatlarınız. Kendi koordinatlarınız bu bilgisayarda hatırlanır.

Çizimden sonra hesabın çözünürlüğü yazılır. Eğriler arası bantlar ayrı renklerle doldurulur.

### Noktalar

Her satır: `isim, enlem, boylam`. Satıra `#d62828` gibi bir renk kodu eklenirse o nokta o renkte çizilir. İşaret şekli, boyutu ve varsayılan rengi aynı bölümden seçilir; **Etikette koordinatı da göster** ile ismin altına DMS koordinat yazılır.

### Ölçüm

Ölçüm bölümü açıkken haritaya her tıklama bir nokta ekler ve onu öncekine büyük daire yayıyla bağlar.

- Her parçanın ortasında mesafe (km / NM) ve kerteriz, hat sonunda toplam yazar.
- Tıklama 10 piksel içindeki noktalara, alan köşelerine ve daire merkezlerine yapışır; yapıştığı noktanın adı listeye yazılır.
- Sürüklemek haritayı kaydırır, nokta eklemez.
- `Esc` yeni bir hat başlatır, `Geri` tuşu son noktayı siler. Listeden tek tek nokta silinebilir.
- **Koordinatla nokta ekle** kutusuna koordinat yazıp `Enter` ile de nokta eklenir.

### Notlar

Notlar bölümü açıkken haritaya açıklama notları ve oklar eklenir; paftayla birlikte basılır ve projeye kaydedilir.

- **Not** kipinde haritaya tıklayın; not listeye eklenir ve metin kutusu açılır. Birden çok satır yazılabilir.
- **Ok** kipinde önce okun başlangıcına, sonra ucuna tıklayın (`Esc` yarım oku bırakır). Oka isteğe bağlı bir etiket yazılabilir; listede uzunluğu ve kerterizi görünür.
- Renk ve yazı boyutu yeni eklenenlere uygulanır; listedeki renk kutusuyla tek tek değiştirilir.

## Haritada düzenleme, geri al

Alan köşeleri, noktalar, daire merkezleri, ölçüm noktaları, notlar ve ok uçları haritada **tutup sürüklenerek** taşınır: imleç üzerlerine gelince taşıma imlecine döner, sürüklerken yeni koordinat yanında yazar. Bırakınca yeni koordinat listedeki satıra, yalnız koordinat kısmı değiştirilerek yazılır (ad, nokta no, renk kodu ve yarıçap korunur).

- Liste çizimden sonra elle değiştirildiyse taşıma geri alınır ve önce yeniden çizmeniz istenir.
- Görünüm → **Haritada sürükleyerek düzenle** ile kapatılabilir.

**Geri al / yinele:** `Ctrl+Z` / `Ctrl+Y` (ya da `Ctrl+Shift+Z`) ve araç çubuğundaki oklar paftanın tüm durumunu (listeler, renkler, ölçümler, notlar) geri alır; harita görünümü yerinde kalır. Bir metin kutusunun içindeyken bu tuşlar o kutunun kendi geri almasını yapar. Son 60 adım tutulur; proje açınca ya da yeni pafta başlatınca geçmiş sıfırlanır.

## Görünüm

| Ayar | Açıklama |
|---|---|
| Uydu görüntüsü | NASA Blue Marble zemini; yaklaştıkça netleşir (dünya ~7 km, bölge ~1 km, Türkiye ~500 m/piksel). Yoğunluk kaydırıcısıyla soluklaştırılabilir. Araç çubuğundaki **Uydu** düğmesi ve `Ctrl+U` aynı işi yapar. Daha yakın ölçek için **uydu paketi** (aşağıda). |
| Koordinat biçimi | DMS, ondalık dakika, ondalık derece, UTM, MGRS |
| Projeksiyon | Mercator (açı koruyan) ya da eş uzaklıklı silindirik |
| Pafta künyesi | Başlık, alt satır, ölçek, projeksiyon, datum, tarih ve kuzey oku (sağ alt) |
| Bulduru haritası | Görüntülenen alanı daha geniş bir çevre içinde gösteren küçük harita (künyenin üstünde) |
| Lejant | Tüm katmanlar, alanlar ve toplamlarla (sol üst) |
| Koordinat kılavuzu ve çerçeve | Yakınlaşmaya göre sıklaşan kılavuz; dört kenarda dereceli çerçeve ve etiketler |
| İl ve ilçe sınırları, adları | Türkiye'ye yaklaştıkça: yaklaşık 1:17 milyondan itibaren il sınırları, 1:10 milyondan itibaren il adları, 1:2,6 milyondan itibaren ilçe sınırları, 1:1,2 milyondan itibaren ilçe adları. Adlar sığdığı kadar yazılır; alanı büyük olan önce yer bulur. |
| FIR sınırları ve adları, ülke sınırları, şehirler | Taban harita öğeleri. Türkiye ve çevresinde yaklaşınca kıyı ayrıntılı veriye geçer. |
| Alanların içini doldur | Alanlar, daire bantları ve mesafe bantları için |
| Katmanlar | Alanlar, daireler, sınır mesafeleri, noktalar, ölçüm hatları, notlar ve oklar ayrı ayrı gizlenir |
| Haritada sürükleyerek düzenle | Açık/kapalı |

### Uydu paketi

Gömülü uydu görüntüsü bölge ölçeği içindir. Daha yakın ölçek (ör. 1:50.000) için internete bağlı bir bilgisayarda bir **uydu paketi** (`.paftauydu`) hazırlanıp çevrimdışı bilgisayara taşınır:

1. İnternete bağlı bir bilgisayarda Python 3 ile depodaki `tools/uydu_paketi.py` betiğini çalıştırın:
   ```
   python uydu_paketi.py                     # Türkiye, ~30 m/piksel, ~500 MB
   python uydu_paketi.py --zmax 13           # ~15 m/piksel, ~2 GB
   python uydu_paketi.py --kapsam 28.5 40.5 30.5 41.6 --zmax 15 -o istanbul.paftauydu
   ```
   Varsayılan kaynak **EOX Sentinel-2 cloudless 2016**'dır (10 m, bulutsuz; CC BY 4.0). İndirme yarıda kalırsa komutu yeniden çalıştırın; inenler tekrar indirilmez.
2. Oluşan `.paftauydu` dosyasını USB bellekle taşıyın.
3. PAFTA'da Görünüm → Uydu görüntüsü → **Paket aç…** ile seçin (ya da dosyayı haritaya sürükleyin).

Masaüstü sürümü paketi hatırlar ve sonraki açılışlarda kendiliğinden yükler; tarayıcı sürümünde her açılışta yeniden seçilir. Paket belleğe alınmaz, döşemeler gerektikçe diskten okunur. Paket kullanılan paftalarda künyedeki "Zemin" satırı paket adını yazar ve kaynağın atıf metni ölçek çubuğunun üstüne basılır.

## Proje dosyası

**Çıktı → Proje** bölümü:

- **Kaydet** (`Ctrl+S`): Masaüstü sürümünde aynı dosyaya yazar; tarayıcı sürümünde `.pafta` dosyası olarak indirir.
- **Farklı kaydet** (`Ctrl+Shift+S`, yalnız masaüstü).
- **Aç** (`Ctrl+O`): Bir `.pafta` dosyası açar. Dosyayı haritaya sürükleyip bırakmak da aynı işi yapar.
- **Yeni** (`Ctrl+N` masaüstünde): Boş bir pafta.

Bir `.pafta` dosyası tüm girdileri, renkleri, gizli/görünür durumları, ölçüm hatlarını, künye metinlerini ve son harita görünümünü saklar. Kaydedilmemiş değişiklik olduğunda dosya adının yanında turuncu bir nokta, pencere başlığında `●` görünür.

Bir `.pafta` dosyası notları ve okları da saklar.

**Sürükle-bırak:** `.pafta` dosyası projeyi açar. Bir koordinat listesi (`.txt`, `.csv`) ya da Excel dosyası (`.xlsx`) açık araca yüklenir (Noktalar ve Daireler açıksa oraya, aksi halde Alanlar'a). Bir `.paftauydu` dosyası uydu paketi olarak yüklenir.

### Masaüstü sürümüne özgü

- **Son açılanlar:** Çıktı bölümünde son sekiz pafta; tıklayınca açılır.
- **Kurtarma kaydı:** Kaydedilmemiş değişiklikler 15 saniyede bir `%LOCALAPPDATA%\PAFTA\kurtarma.pafta` dosyasına yazılır. Uygulama beklenmedik şekilde kapanırsa bir sonraki açılışta geri yüklemek önerilir.
- **Kapatma uyarısı:** Kaydedilmemiş değişiklikle pencere kapatılırken *Kaydet / Kaydetmeden devam et / Vazgeç* sorulur.
- **Pencere:** Boyut ve konum hatırlanır.

## Çıktılar

| Biçim | İçerik |
|---|---|
| PNG | Ekrandaki pafta, künye ve lejant dahil. Çözünürlük: ekran (1×), baskı (2×), yüksek (3×). |
| KML | Alanlar (dolgulu), daireler, mesafe eğrileri, noktalar ve ölçüm hatları; renkleriyle. Google Earth'te açılır. |
| GeoJSON | Aynı katmanlar; ölçüm hatlarında parça mesafeleri ve kerterizler özellik olarak. |
| PDF | **Ölçekli baskı** (aşağıda): A4 ya da A3, yatay ya da dikey, sabit ölçek, 150–300 dpi. |
| CSV | Alan köşeleri, daire merkezleri, noktalar ve ölçüm noktaları; ondalık, DMS, UTM ve MGRS koordinatlar. Excel'de doğrudan açılır (noktalı virgül ayraçlı, ondalık virgüllü). |
| Excel | Alan raporu (Alanlar bölümü → Alan raporu → Excel'e aktar) |

### Ölçekli baskı (PDF)

Çıktı → **Ölçekli baskı** bölümü paftayı kâğıda **gerçek ölçekte** basılacak bir PDF olarak verir.

- **Kâğıt ve yön:** A4 ya da A3, yatay ya da dikey; 10 mm kenar boşluğu.
- **Ölçek:** `1:250.000` gibi yazın ya da listeden seçin. Boş bırakılırsa ekrandaki alan sayfaya sığdırılır.
- **Sayfa çerçevesi:** Çıktı bölümü açıkken haritanın ortasında, basılacak alanı gösteren kesikli bir çerçeve ve ölçeği görünür. Haritayı kaydırarak yerleştirin.
- **Çözünürlük:** 150, 200 ya da 300 dpi.

Künye, lejant, bulduru haritası ve ölçek çubuğu baskı sayfasına göre yeniden yerleşir; künyedeki ölçek kâğıt üzerinde geçerlidir. Yazdırırken yazıcı penceresinde **Gerçek boyut / %100** seçin ("Sayfaya sığdır" ölçeği bozar).

Dosya adları künye başlığından türetilir (`Karadeniz Test Bölgeleri` → `karadeniz-test-bolgeleri.png`).

## Kısayollar

| Tuş | İşlev |
|---|---|
| `Ctrl+S` / `Ctrl+Shift+S` | Kaydet / Farklı kaydet |
| `Ctrl+O` | Aç |
| `Ctrl+N` | Yeni pafta (masaüstü) |
| `Ctrl+E` | PNG kaydet |
| `Ctrl+1` … `Ctrl+8` | Alanlar, Daireler, Sınır mesafesi, Noktalar, Ölçüm, Notlar, Görünüm, Çıktı |
| `Ctrl+Z` / `Ctrl+Y` | Geri al / yinele (metin kutusu dışında) |
| `Ctrl+0` | Çizime sığdır |
| `Ctrl+U` | Uydu görüntüsü |
| `Ctrl++` / `Ctrl+−` | Yakınlaş / uzaklaş |
| Tekerlek, sürükleme | Yakınlaş, kaydır |
| `Esc` / `Geri` | Ölçümde yeni hat / son noktayı sil; haritadan seçimi bitir; yarım oku bırak; pencereleri kapat |
| `F1` | Kısayollar ve veri kaynakları |
