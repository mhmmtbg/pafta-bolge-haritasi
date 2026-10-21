# Kullanım

## Koordinat biçimleri

Bütün araçlar aynı ayrıştırıcıyı kullanır. Tablolar Excel veya Word'den olduğu gibi yapıştırılabilir; sekme, noktalı virgül, virgül ve boşluk ayraç olarak kabul edilir.

| Biçim | Örnek |
|---|---|
| Derece‑dakika‑saniye | `41°30'15"K  30°15'00"D`, saniyede ondalık: `41°30'15,4"K` |
| Derece, ondalık dakika | `41°30,25'K  30°15,5'D` |
| Boşluklu DMS (yön harfi zorunlu) | `41 30 15 K  30 15 00 D` |
| Ondalık derece | `41.5042  30.25`, `41,5042  30,25`, `41.50420°K 30.25000°D` |
| NOTAM (bitişik) | `4130N 03015E`, `413015N0301500E`, `4130.2N 03015.5E`; boylamın baştaki sıfırı yazılmayabilir: `413015N, 324530E`, `4130N, 3245E` |
| NAVTEX (derece-dakika) | `41-30.25K 030-15.50D`, `41 30.25N 030 15.50E` |
| UTM | `36S 487182 4419444` |
| MGRS | `36S VK 87182 19443` (2–10 basamak) |

- Yön harfleri: **K/G/D/B** ve **N/S/E/W**. Yön harfi yoksa ilk sayı enlem, ikinci sayı boylam kabul edilir.
- Sırası ters yazılmış çiftler (önce boylam) yön harflerinden anlaşılır.
- Okunamayan satırlar listenin altında satır numarasıyla gösterilir.

**Gösterim biçimi:** Görünüm → **Koordinat biçimi** ile listelerde, etiketlerde, imleç göstergesinde ve araçların listeye yazdığı koordinatlarda kullanılacak biçim seçilir: derece-dakika-saniye, ondalık dakika, ondalık derece, UTM ya da MGRS. CSV çıktısında UTM ve MGRS sütunları her zaman bulunur.

**İmleç göstergesi:** Haritanın altındaki gösterge imlecin koordinatını seçili biçimde yazar; Türkiye içindeyse il ve ilçeyi, sağ ucunda da anlık ölçeği gösterir.

**Çok sayıda nokta:** Noktalar ve Ölçüm sekmelerinde liste kendi kutusunda kaydırılır; başlık, girdi alanı ve işaret ayarları yerinde kalır. Liste yalnız görünen satırları oluşturduğu için on binlerce nokta da akıcıdır. Noktalar sekmesindeki **arama kutusu** adı ya da koordinatı yazılana göre listeyi süzer. Haritada çok sıkışık görünümde bazı nokta adları yazılmaz; yaklaştıkça görünür. Lejant en çok 12 alan ve 8 ölçüm hattı sayar, fazlasını "+ N daha" diye özetler.

**Nokta seçimi:** Nokta listesinde bir satıra tıklamak o noktayı haritada turuncu halkayla gösterir; yeniden tıklamak kaldırır.

**Alan dışındaki noktalar:** Noktalar → İşaret → *Alanların dışındaki noktaları vurgula* açıkken çizili alanların hiçbirinin içinde kalmayan noktalar kırmızı halkayla işaretlenir. Nokta listesinin üstünde toplam nokta sayısı, dışarıda kalan ve içeride kalan nokta sayıları ile yüzdeleri yazılır. Alanların içi ekrandaki çizgilere göre (çokgenin köşelerini birleştiren doğrular) hesaplanır; gizli alanlar sayılmaz. *Daireleri de alan say* ile daireler de içeri sayılır.

**Sekme rozetleri:** Sol şeritteki araç düğmelerinin köşesindeki sayı, o araçtaki öğe sayısıdır (alan, daire merkezi, mesafe eğrisi, nokta, ölçüm noktası, not).

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

Alanlar, Daireler, Noktalar ve Notlar → Çizgi bölümlerindeki **Dosyadan al** düğmesi metin (`.txt`, `.csv`), Excel (`.xlsx`) ve Google Earth (`.kml`, `.kmz`) dosyalarını okur. Dosyayı haritaya sürükleyip bırakmak da aynı işi yapar (açık bölüme yüklenir).

**Birden çok dosya** aynı anda seçilebilir ya da sürüklenebilir. Metin ve CSV dosyaları tek listede birleşir; adı olmayan bir alan ya da çizgi dosya adını alır (`saha_kuzey.txt` → "saha kuzey"). Excel ve KML dosyalarının pencereleri sırayla, biri kapanınca öteki açılır. `.pafta` dosyaları çoklu seçimde atlanır.

Excel dosyası seçildiğinde **sütun eşleştirme** penceresi açılır:

1. Birden çok sayfa varsa sayfayı seçin.
2. Sütunlar başlıklarından (`Bölge`, `Nokta`, `Enlem`, `Boylam`, `MGRS`, `Yarıçap`, `Renk`…) ya da içeriklerinden tahmin edilir; gerekirse elle değiştirin. Koordinat tek bir sütunda da olabilir (MGRS, UTM ya da `41°30'K 29°15'D`): Boylam sütununu "—" bırakın.
3. Önizleme tablosunda her satırın okunan koordinatı görünür; okunamayan satırlar atlanır.
4. **Ekle**: satırlar seçilen listeye eklenir (ya da **Mevcut listeyi değiştir** ile onun yerine yazılır) ve çizilir.

Aynı bölge adının her satırda tekrarlandığı tablolar tek alan olarak okunur (araya boş satır girerse aynı adla yeni bir alan başlar). Daireler için yarıçap sütununda yalnız sayı varsa seçilen birim eklenir. Eski `.xls` biçimi okunmaz; Excel'de `.xlsx` olarak kaydedin.

## KML / KMZ'den al

Google Earth'ten ya da başka bir programdan gelen `.kml` ve `.kmz` dosyaları **Dosyadan al** ile seçilir ya da haritaya sürüklenir. Bir önizleme penceresi açılır:

- **Poligonlar** alan, **noktalar** nokta, **çizgiler** Notlar'da çizgi olarak önerilir. Daireye benzeyen kapalı şekiller (köşeleri bir merkezden eşit uzaklıkta) merkez ve yarıçapıyla **daire** olarak tanınır.
- Her satırın sağındaki seçimle öğenin nereye ekleneceği değiştirilir: alan, daire, nokta, not, çizgi, ölçüm hattı ya da **Alma**. Üstteki **Hepsini** seçimleri bir türün tamamını tek seferde değiştirir.
- **KML renklerini kullan** açıkken çizgi, dolgu ve ikon renkleri alınır (beyaz ve saydam renkler hariç).
- **Mevcut listeleri değiştir** kapalıyken öğeler listelerin sonuna eklenir.

Klasörler ve çoklu geometriler (MultiGeometry) açılır; adı olmayan öğeler klasör adıyla numaralanır. 400'den çok köşeli şekiller şekli koruyarak sadeleştirilir, poligonların iç boşlukları alınmaz. PAFTA'nın kendi KML çıktısı geri okunduğunda alanlar, daireler, noktalar ve ölçüm hatları aynen geri gelir.

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
- Listede her bölgenin nokta sayısı, alanı ve çevresi yazar; renk kutusuna tıklayarak rengi değiştirin, göz ikonuyla gizleyin, hedef ikonuyla haritada odaklayın. Satırın üzerine gelince alan haritada vurgulanır.
- **Stil** (taralı kare ikonu) alanın altında iki seçim açar: **Dolgu** (düz, tarama, çapraz tarama, dolgusuz) ve **Sınır** (düz, kesikli, taraklı). Taraklı sınır ICAO paftalarındaki kısıtlı saha gösterimidir; dişler alanın içine döner. Stiller projeye kaydedilir ve baskıya çıkar.
- Alan adı poligonun içinde kenara en uzak noktaya yazılır; başka yazıyla çakışırsa yakına kayar.
- "Bölgeleri çiz" yeniden çalıştırıldığında aynı adlı alanların rengi, görünürlüğü ve stili korunur.

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

Her satır: `isim, enlem, boylam`. Satıra `#d62828` gibi bir renk kodu eklenirse o nokta o renkte çizilir. Örnekler: `Tepe 1 413015N, 324530E #d62828`, `Tepe 2 413015N, 324530E`, `413015N, 324530E` (ad yoksa "Nokta 3" gibi adlandırılır). İşaret şekli, boyutu ve varsayılan rengi aynı bölümden seçilir. **Nokta adlarını göster** kapatılırsa haritada yalnız işaretler kalır (adlar listede ve projede korunur). **Etikette koordinatı da göster** ile ismin altına koordinat yazılır; adlar kapalıyken etikette yalnız koordinat görünür.

### Ölçüm

Ölçüm bölümü açıkken haritaya her tıklama bir nokta ekler ve onu öncekine büyük daire yayıyla bağlar.

- Her parçanın ortasında mesafe (km / NM) ve kerteriz, hat sonunda toplam yazar.
- Tıklama 10 piksel içindeki noktalara, alan köşelerine ve daire merkezlerine yapışır; yapıştığı noktanın adı listeye yazılır.
- Sürüklemek haritayı kaydırır, nokta eklemez.
- `Esc` yeni bir hat başlatır, `Geri` tuşu son noktayı siler. Listeden tek tek nokta silinebilir.
- **Koordinatla nokta ekle** kutusuna koordinat yazıp `Enter` ile de nokta eklenir.

### Notlar

Notlar bölümü açıkken haritaya açıklama notları, oklar ve çizgiler eklenir; paftayla birlikte basılır ve projeye kaydedilir.

- **Not** kipinde haritaya tıklayın; not listeye eklenir ve metin kutusu açılır. Birden çok satır yazılabilir.
- **Ok** kipinde önce okun başlangıcına, sonra ucuna tıklayın (`Esc` yarım oku bırakır). Oka isteğe bağlı bir etiket yazılabilir; listede uzunluğu ve kerterizi görünür.
- **Çizgi** kipinde haritaya tıklayarak köşe eklenir ya da **Koordinatlarla çizgi** listesine sıralı koordinatlar yazılır ve **Çizgileri çiz** denir. Liste Alanlar biçimindedir: her grup bir çizgi, boş satır ya da yeni ad yeni çizgi. Liste **Dosyadan al** (metin, CSV, Excel, KML; birden çok dosya) ve **Haritadan seç** ile de doldurulur. Listeden gelen çizgilerin köşeleri sürüklenince yeni koordinat listeye yazılır; **Çizgileri çiz** yeniden basıldığında liste çizgileri renk ve stilleri korunarak yenilenir, elle çizilen çizgilere dokunulmaz.
- **Eğri:** Çizgi ayarlarındaki **Eğri** açıkken çizgi, verilen bütün noktalardan geçen yumuşak bir eğri olarak çizilir (Catmull-Rom'dan türetilen Bezier). Listede her çizginin yanındaki eğri düğmesi o çizgiyi eğri ya da köşeli yapar.
- **Çizgi** kipinde her tıklama bir köşe ekler; çizgi düz parçalarla çizilir. Son köşeye yeniden tıklamak, çift tıklamak, `Enter` ya da **Çizgiyi bitir** çizgiyi tamamlar; `Geri` tuşu son köşeyi siler, `Esc` yarım çizgiyi bırakır. **Çizgi tipi** (düz, kesikli, noktalı) ve **kalınlık** yeni çizgilere uygulanır. Çizgiye isteğe bağlı bir etiket yazılabilir (ortasında görünür); listede köşe sayısı ve toplam uzunluğu yazar.
- Renk ve yazı boyutu yeni eklenenlere uygulanır; listedeki renk kutusuyla tek tek değiştirilir.

## Haritada düzenleme, geri al

Alan köşeleri, noktalar, daire merkezleri, ölçüm noktaları, notlar, ok uçları ve çizgi köşeleri haritada **tutup sürüklenerek** taşınır: imleç üzerlerine gelince taşıma imlecine döner, sürüklerken yeni koordinat yanında yazar. Bırakınca yeni koordinat listedeki satıra, yalnız koordinat kısmı değiştirilerek yazılır (ad, nokta no, renk kodu ve yarıçap korunur).

- Liste çizimden sonra elle değiştirildiyse taşıma geri alınır ve önce yeniden çizmeniz istenir.
- Görünüm → **Haritada sürükleyerek düzenle** ile kapatılabilir.

## Seçme ve silme

Ölçüm ve Not araçları açık değilken haritada tıklamak tıklanan öğeyi seçer: **nokta**, **alan** (köşesine, kenarına ya da içine), **daire** (halkasına), **mesafe eğrisi**, **ölçüm noktası** ya da **hattı**, **not**, **ok** ve **çizgi**. En üstteki öğe önceliklidir (nokta, ölçüm noktası, not, alan köşesi, çizgiler, alan içi). `Ctrl` ya da `Shift` ile tıklamak seçime ekler veya çıkarır, boşluğa tıklamak seçimi kaldırır. `Shift` ile sürükleyerek çizilen dikdörtgen, tamamı içinde kalan öğeleri seçer; `Ctrl+A` görünen katmanlardaki her şeyi seçer. Haritadan seçilen nokta, Noktalar sekmesi açıksa listede de görünür kalır.

Seçili öğeler haritada mavi halkayla, listelerde mavi çerçeveli satırla işaretlenir; listedeki bir satıra tıklamak da onu seçer. Haritanın üstündeki çubuk seçili öğe sayısını ve türlerini gösterir.

`Delete` (ya da çubuktaki **Sil**) seçili öğeleri siler. Alanlar, noktalar, daire merkezleri ve listeden gelen çizgiler için koordinat listesindeki satırlar da çıkarılır; böylece listeyi yeniden çizince geri gelmezler. Listede elle değiştirilmiş satırlar silinmez ve kaç satırın atlandığı bildirilir. `Ctrl+Z` silmeyi geri alır. Seçimi `Esc` kaldırır.

Görünüm → **Alan adlarını göster** ile alan adları haritada gizlenebilir.

**Geri al / yinele:** `Ctrl+Z` / `Ctrl+Y` (ya da `Ctrl+Shift+Z`) ve araç çubuğundaki oklar paftanın tüm durumunu (listeler, renkler, ölçümler, notlar) geri alır; harita görünümü yerinde kalır. Bir metin kutusunun içindeyken bu tuşlar o kutunun kendi geri almasını yapar. Son 60 adım tutulur; proje açınca ya da yeni pafta başlatınca geçmiş sıfırlanır.

## Görünüm

| Ayar | Açıklama |
|---|---|
| Arayüz teması | Koyu ya da açık; panel, araç şeridi ve listeler için. Harita, künye ve pencereler değişmez. Bu bilgisayarda hatırlanır, projeye yazılmaz. |
| Uydu görüntüsü | NASA Blue Marble zemini; yaklaştıkça netleşir (dünya ~7 km, bölge ~1 km, Türkiye ~500 m/piksel). Yoğunluk kaydırıcısıyla soluklaştırılabilir. Araç çubuğundaki **Uydu** düğmesi ve `Ctrl+U` aynı işi yapar. Daha yakın ölçek için **uydu paketi** (aşağıda). |
| Koordinat biçimi | DMS, ondalık dakika, ondalık derece, UTM, MGRS |
| Projeksiyon | Mercator (açı koruyan) ya da eş uzaklıklı silindirik |
| Pafta künyesi | Başlık, alt satır, ölçek, projeksiyon, datum, tarih ve kuzey oku (sağ alt). Künye gizliyken sağ altta bağımsız bir kuzey oku çizilir. |
| Bulduru haritası | Görüntülenen alanı daha geniş bir çevre içinde gösteren küçük harita (künyenin üstünde); ülke sınırları ve ince kılavuzla |
| Lejant | Tüm katmanlar, alanlar ve toplamlarla (sol üst) |
| Koordinat kılavuzu ve çerçeve | Yakınlaşmaya göre sıklaşan kılavuz; dört kenarda dereceli çerçeve ve etiketler |
| İl ve ilçe sınırları, adları | Türkiye'ye yaklaştıkça: yaklaşık 1:17 milyondan itibaren il sınırları, 1:10 milyondan itibaren il adları, 1:2,6 milyondan itibaren ilçe sınırları, 1:1,2 milyondan itibaren ilçe adları. Adlar sığdığı kadar yazılır; alanı büyük olan önce yer bulur. |
| FIR sınırları ve adları, ülke sınırları, şehirler | Taban harita öğeleri. Türkiye ve çevresinde yaklaşınca kıyı ayrıntılı veriye geçer. |
| Alanların içini doldur | Alanlar, daire bantları ve mesafe bantları için |
| Dolgu yoğunluğu | Dolguların saydamlığı (tarama çizgileri de buna göre koyulaşır) |
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

## Dosya menüsü

Harita üstündeki araç çubuğunun solundaki **Dosya** düğmesi (ya da sol üstteki PAFTA işareti) bütün dosya işlerini toplar: Yeni pafta, Aç, son açılan paftalar (masaüstü), Kaydet, Farklı kaydet, **PDF olarak kaydet** (Çıktı bölümündeki kâğıt, yön, ölçek ve çözünürlük ayarlarıyla; menüde geçerli ayar yazar), PDF ayarları, PNG, KML, GeoJSON, CSV ve açık/koyu tema. Menü `Esc` ile ya da dışarı tıklayınca kapanır, ok tuşlarıyla gezilir.

## Proje dosyası

**Dosya** menüsü ya da **Çıktı → Proje** bölümü:

- **Kaydet** (`Ctrl+S`): Açık dosyanın üzerine yazar; dosya henüz yoksa nereye kaydedileceğini sorar. Tarayıcı sürümünde de Edge ve Chrome'da böyledir; bu özelliği olmayan tarayıcılarda `.pafta` dosyası indirilir.
- **Farklı kaydet** (`Ctrl+Shift+S`): Yeni bir dosya adı ve yeri seçtirir.
- **Aç** (`Ctrl+O`): Bir `.pafta` dosyası açar. Dosyayı haritaya sürükleyip bırakmak da aynı işi yapar (bu durumda Kaydet yine yer sorar).
- **Yeni** (`Ctrl+N` masaüstünde): Boş bir pafta.

Bir `.pafta` dosyası tüm girdileri, renkleri, gizli/görünür durumları, ölçüm hatlarını, künye metinlerini ve son harita görünümünü saklar. Kaydedilmemiş değişiklik olduğunda dosya adının yanında turuncu bir nokta, pencere başlığında `●` görünür.

Bir `.pafta` dosyası notları ve okları da saklar.

**Sürükle-bırak:** `.pafta` dosyası projeyi açar. Bir koordinat listesi (`.txt`, `.csv`) ya da Excel dosyası (`.xlsx`) açık araca yüklenir (Noktalar ve Daireler açıksa oraya, aksi halde Alanlar'a). Bir `.kml` ya da `.kmz` dosyası içe aktarma penceresini açar. Bir `.paftauydu` dosyası uydu paketi olarak yüklenir.

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
| Tıklama, `Ctrl`/`Shift` + tıklama | Haritada öğe seç; seçime ekle / çıkar |
| `Shift` + sürükleme, `Ctrl+A` | Dikdörtgenle seç; hepsini seç |
| `Delete` | Seçili öğeleri sil (listedeki satırlarıyla; `Ctrl+Z` geri alır) |
| `Esc` / `Geri` | Ölçümde yeni hat / son noktayı sil; haritadan seçimi bitir; yarım oku bırak; pencereleri kapat |
| `F1` | Kısayollar ve veri kaynakları |
