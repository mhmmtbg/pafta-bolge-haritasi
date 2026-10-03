/* PAFTA exe köprüsü: sayfaya window.masaustu arayüzünü sağlar.
   Dosya pencereleri, proje kaydı, kurtarma kaydı ve indirmeler Go tarafına (main.go) bağlanır.
   HTML bu nesneyi bulamazsa normal tarayıcı moduna döner; app/pafta.html iki sürüm için de tek kaynaktır. */
(function(){
  if (window.masaustu) return;
  var bekleyen = {}, sayac = 0;
  window.__ncb = function(id, sonuc){ var f = bekleyen[id]; delete bekleyen[id]; if (f) f(sonuc); };
  function diyalog(tur, baslik, ad, filtre){
    return new Promise(function(coz){ var id = ++sayac; bekleyen[id] = coz; window.nativeDiyalog(id, tur, baslik || "", ad || "", filtre || ""); });
  }
  function soru(mesaj, detay, dugmeler, tur){
    return new Promise(function(coz){ var id = ++sayac; bekleyen[id] = coz; window.nativeSoru(id, mesaj || "", detay || "", dugmeler.join("|"), tur || ""); });
  }
  function blobB64(blob){
    return new Promise(function(coz, red){ var r = new FileReader(); r.onload = function(){ coz(String(r.result).split(",")[1] || ""); }; r.onerror = red; r.readAsDataURL(blob); });
  }
  var PROJE = "PAFTA projesi (*.pafta)|*.pafta|Tüm dosyalar (*.*)|*.*";
  var TURLER = { png:"PNG görüntüsü", kml:"KML (Google Earth)", geojson:"GeoJSON", csv:"CSV dosyası", pafta:"PAFTA projesi", json:"JSON dosyası", xlsx:"Excel çalışma kitabı", pdf:"PDF belgesi" };
  function tekFiltre(uz){ return (TURLER[uz] || uz.toUpperCase()) + " (*." + uz + ")|*." + uz + "|Tüm dosyalar (*.*)|*.*"; }

  var menuCb = null, bildirimCb = null;
  window.__menu = function(k){ if (menuCb) menuCb(k); };

  window.masaustu = {
    baslangic: function(){ return window.nativeBaslangic(); },
    ac: function(yol){ return yol ? window.nativeOku(yol) : diyalog("ac", "Pafta aç", "", PROJE); },
    kaydetYeri: function(s){
      s = s || {};
      var uz = s.uzanti || "pafta";
      return diyalog("kaydetYeri", s.baslik || "Farklı kaydet", s.ad || ("Adsız pafta." + uz), uz === "pafta" ? PROJE : tekFiltre(uz));
    },
    yaz: function(yol, icerik, projeMi){ return window.nativeYaz(yol, icerik, false, !!projeMi); },
    soru: function(s){ return soru(s.mesaj, s.detay, s.dugmeler || ["Tamam"], s.tur); },
    kurtarmaYaz: function(v){ window.nativeKurtarmaYaz(v); },
    kurtarmaOku: function(){ return window.nativeKurtarmaOku(); },
    kurtarmaSil: function(){ window.nativeKurtarmaSil(); },
    sonAcilanlar: function(){ return window.nativeSonAcilanlar(); },
    sonTemizle: function(){ return window.nativeSonTemizle(); },
    veriKlasoru: function(){ return window.nativeVeriKlasoru(); },
    kirli: function(d){ window.nativeKirli(!!d, document.title); },
    kapat: function(){ window.nativeKapat(); },
    konumuAc: function(yol){ window.nativeKonum(yol); },
    menu: function(cb){ menuCb = cb; },
    bildirim: function(cb){ bildirimCb = cb; }
  };

  /* PNG / KML / GeoJSON / CSV indirmeleri: Windows'un "Farklı kaydet" penceresi */
  var bloblar = {};
  var ozgunOlustur = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(b){ var u = ozgunOlustur(b); if (b instanceof Blob) bloblar[u] = b; return u; };
  function indir(blob, ad){
    var uz = (ad.split(".").pop() || "").toLowerCase();
    diyalog("kaydetYeri", "Farklı kaydet", ad, tekFiltre(uz)).then(function(yol){
      if (!yol) return;
      return blobB64(blob).then(function(b64){ return window.nativeYaz(yol, b64, true, false); }).then(function(r){
        if (r && r.ok && bildirimCb) bildirimCb("Kaydedildi: " + r.ad);
      });
    });
  }
  var ozgunTikla = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    if (this.hasAttribute("download") && bloblar[this.href]) { indir(bloblar[this.href], this.getAttribute("download") || "dosya"); return; }
    return ozgunTikla.call(this);
  };

  /* alert / confirm: uygulama adlı Windows mesaj kutusu (senkron) */
  function mesajKutusu(k, metin){
    try {
      var x = new XMLHttpRequest();
      x.open("POST", location.pathname.replace(/\/?$/, "/") + "__mesaj?k=" + k, false);
      x.send(String(metin == null ? "" : metin));
      return x.responseText === "1";
    } catch (e) { return k === "confirm" ? false : true; }
  }
  window.alert = function(m){ mesajKutusu("alert", m); };
  window.confirm = function(m){ return mesajKutusu("confirm", m); };

  /* sayfa yenileme, yazdırma, bul ve tarayıcı sağ tık menüsü kapalı: bir masaüstü uygulaması gibi davranır */
  window.addEventListener("keydown", function(e){
    var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === "f5" || k === "f3" || k === "f7" || (mod && (k === "r" || k === "p" || k === "f" || k === "g" || k === "j" || k === "h"))) e.preventDefault();
  }, true);
  window.addEventListener("contextmenu", function(e){
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName))) return;
    e.preventDefault();
  });
})();
