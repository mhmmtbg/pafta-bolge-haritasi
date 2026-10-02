# Kullanım

## Koordinat biçimleri

Bütün araçlar aynı ayrıştırıcıyı kullanır. Tablolar Excel veya Word'den olduğu gibi yapıştırılabilir; sekme, noktalı virgül, virgül ve boşluk ayraç olarak kabul edilir.

| Biçim | Örnek |
|---|---|
| Derece‑dakika‑saniye | `41°30'15"K  30°15'00"D` |
| Derece‑dakika | `41°30'K  30°15'D` |
| Boşluklu DMS (yön harfi zorunlu) | `41 30 15 K  30 15 00 D` |
| Ondalık derece | `41.5042  30.25` ya da `41,5042  30,25` |

- Yön harfleri: **K/G/D/B** ve **N/S/E/W**. Yön harfi yoksa ilk sayı enlem, ikinci sayı boylam kabul edilir.
- Sırası ters yazılmış çiftler (önce boylam) yön harflerinden anlaşılır.
- Okunamayan satırlar listenin altında satır numarasıyla gösterilir.

## Haritadan seç

Alanlar, Daireler ve Noktalar listelerinin başlığında (ve Mavi Vatan için kendi koordinatlarınız seçildiğinde) **Haritadan seç** düğmesi vardır. Renk seçicideki damlalık gibi çalışır:

1. Düğmeye basın; düğme turuncu olur, imleç artıya döner ve imlecin koordinatı yanında görünür.
2. Haritaya her tıklama, o yerin koordinatını listeye yeni bir satır olarak ekler ve çizim hemen güncellenir. Haritayı sürüklemek nokta eklemez.
3. İmleç 10 piksel içindeki noktalara, alan köşelerine ve daire merkezlerine yapışır; adı yanında yazar.
4. `Esc`, **Bitti** ya da düğmeye yeniden basmak seçimi bitirir.

Alanlarda her tıklama son alana yeni bir köşe ekler; listeye boş bir satır eklerseniz sonraki tıklamalar yeni bir alan başlatır. Noktalar "Nokta 1, Nokta 2…", daire merkezleri "Merkez 1…" diye adlandırılır; adları listede değiştirebilirsiniz.

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
- **Dosyadan al** ile `.txt` / `.csv` dosyası yüklenebilir.
- Listede her bölgenin nokta sayısı, alanı ve çevresi yazar; renk kutusuna tıklayarak rengi değiştirin, **gizle** ve **odak** ile tek bölgeyle çalışın.

### Daireler

Her satır bir merkezdir (`ad, enlem, boylam`); yarıçaplar virgülle yazılır (`100, 250, 500`) ve hepsi her merkeze uygulanır. Birim kilometre ya da deniz milidir. Halkalar küre üzerinde gerçek sabit uzaklık eğrisi olarak çizilir.

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

## Görünüm

| Ayar | Açıklama |
|---|---|
| Uydu görüntüsü | NASA Blue Marble zemini; yoğunluk kaydırıcısıyla soluklaştırılabilir. Araç çubuğundaki **Uydu** düğmesi ve `Ctrl+U` aynı işi yapar. |
| Projeksiyon | Mercator (açı koruyan) ya da eş uzaklıklı silindirik |
| Pafta künyesi | Başlık, alt satır, ölçek, projeksiyon, datum, tarih ve kuzey oku (sağ alt) |
| Bulduru haritası | Görüntülenen alanı daha geniş bir çevre içinde gösteren küçük harita (künyenin üstünde) |
| Lejant | Tüm katmanlar, alanlar ve toplamlarla (sol üst) |
| Koordinat kılavuzu ve çerçeve | Yakınlaşmaya göre sıklaşan kılavuz; dört kenarda dereceli çerçeve ve etiketler |
| İl ve ilçe sınırları, adları | Türkiye'ye yaklaştıkça: yaklaşık 1:17 milyondan itibaren il sınırları, 1:10 milyondan itibaren il adları, 1:2,6 milyondan itibaren ilçe sınırları, 1:1,2 milyondan itibaren ilçe adları. Adlar sığdığı kadar yazılır; alanı büyük olan önce yer bulur. |
| FIR sınırları ve adları, ülke sınırları, şehirler | Taban harita öğeleri. Türkiye ve çevresinde yaklaşınca kıyı ayrıntılı veriye geçer. |
| Alanların içini doldur | Alanlar, daire bantları ve mesafe bantları için |

## Proje dosyası

**Çıktı → Proje** bölümü:

- **Kaydet** (`Ctrl+S`): Masaüstü sürümünde aynı dosyaya yazar; tarayıcı sürümünde `.pafta` dosyası olarak indirir.
- **Farklı kaydet** (`Ctrl+Shift+S`, yalnız masaüstü).
- **Aç** (`Ctrl+O`): Bir `.pafta` dosyası açar. Dosyayı haritaya sürükleyip bırakmak da aynı işi yapar.
- **Yeni** (`Ctrl+N` masaüstünde): Boş bir pafta.

Bir `.pafta` dosyası tüm girdileri, renkleri, gizli/görünür durumları, ölçüm hatlarını, künye metinlerini ve son harita görünümünü saklar. Kaydedilmemiş değişiklik olduğunda dosya adının yanında turuncu bir nokta, pencere başlığında `●` görünür.

**Sürükle-bırak:** `.pafta` dosyası projeyi açar. Bir koordinat listesi (`.txt`, `.csv`) açık araca yüklenir ve çizilir (Noktalar ve Daireler açıksa oraya, aksi halde Alanlar'a).

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
| CSV | Alan köşeleri, daire merkezleri, noktalar ve ölçüm noktaları; ondalık ve DMS koordinatlar. Excel'de doğrudan açılır (noktalı virgül ayraçlı, ondalık virgüllü). |

Dosya adları künye başlığından türetilir (`Karadeniz Test Bölgeleri` → `karadeniz-test-bolgeleri.png`).

## Kısayollar

| Tuş | İşlev |
|---|---|
| `Ctrl+S` / `Ctrl+Shift+S` | Kaydet / Farklı kaydet |
| `Ctrl+O` | Aç |
| `Ctrl+N` | Yeni pafta (masaüstü) |
| `Ctrl+E` | PNG kaydet |
| `Ctrl+1` … `Ctrl+7` | Alanlar, Daireler, Sınır mesafesi, Noktalar, Ölçüm, Görünüm, Çıktı |
| `Ctrl+0` | Çizime sığdır |
| `Ctrl+U` | Uydu görüntüsü |
| `Ctrl++` / `Ctrl+−` | Yakınlaş / uzaklaş |
| Tekerlek, sürükleme | Yakınlaş, kaydır |
| `Esc` / `Geri` | Ölçümde yeni hat / son noktayı sil; haritadan seçimi bitir |
| `F1` | Kısayollar ve veri kaynakları |
