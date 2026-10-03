/* ============ uydu paketi (.paftauydu): çevrimdışı, yüksek çözünürlüklü döşemeler ============ */
/* Biçim için tools/uydu_paketi.py ve desktop/uydu.go. Tarayıcıda dosya File.slice ile parça parça okunur
   (belleğe alınmaz); exe'de yerel sunucu döşemeleri "__uydu/z/x/y" adresinden verir ve paket hatırlanır. */
var UYDU_PAKET = null;       // {ad, atif, lisans, zmin, zmax, kaynak (DOSEME_KAYNAKLARI öğesi)}

function paketKaynagi(bilgi, okuyucu){
  const ob = gorselOnbellek(500), anahtar = new Set(bilgi.anahtarlar);
  return {
    ad: bilgi.ad || "Uydu paketi", zmin: bilgi.zmin, zmax: bilgi.zmax, paket: true,
    var: k => anahtar.has(k),
    gorsel(k){
      let im = ob.al(k);
      if (!im){
        im = new Image();
        DOSEME_BEKLEYEN++;
        im.onload = () => { DOSEME_BEKLEYEN--; scheduleDraw(); };
        im.onerror = () => { DOSEME_BEKLEYEN--; };
        ob.koy(k, im);
        okuyucu(k, im);
      }
      return im.complete && im.naturalWidth ? im : null;
    }
  };
}

function paketKur(bilgi, okuyucu){
  DOSEME_KAYNAKLARI = DOSEME_KAYNAKLARI.filter(s => !s.paket);
  UYDU_PAKET = null;
  if (bilgi){
    const k = paketKaynagi(bilgi, okuyucu);
    DOSEME_KAYNAKLARI.push(k);
    UYDU_PAKET = {ad: k.ad, atif: bilgi.atif || "", lisans: bilgi.lisans || "", zmin: bilgi.zmin, zmax: bilgi.zmax,
                  sayi: bilgi.anahtarlar.length, boyut: bilgi.boyut || 0, dosya: bilgi.dosya || ""};
  }
  paketDurum();
  draw();
}

function paketDurum(){
  const p = UYDU_PAKET, d = $("uydu-paket-durum"), k = $("paket-kaynak");
  k.hidden = !p;
  if (p) k.innerHTML = "<b>" + esc(p.ad) + "</b>, yüklü uydu paketi. " + esc(p.atif || "") + (p.lisans ? " " + esc(p.lisans) + "." : "");
  if (!p){ d.innerHTML = 'Yüklü paket yok. <span class="dim">Hazırlamak için: tools/uydu_paketi.py</span>'; $("btn-uydu-kaldir").hidden = true; return; }
  const m = 156543 * Math.cos(rad(39)) / 2 ** p.zmax;
  d.innerHTML = "<b>" + esc(p.ad) + "</b><br>" + esc(p.dosya) + " · " + p.sayi.toLocaleString("tr-TR") + " döşeme · z" + p.zmin + "–z" + p.zmax +
    " (~" + (m < 20 ? m.toFixed(0) : Math.round(m / 5) * 5) + " m)" + (p.boyut ? " · " + (p.boyut / 1048576).toLocaleString("tr-TR", {maximumFractionDigits: 0}) + " MB" : "") +
    (p.lisans ? '<br><span class="dim">' + esc(p.lisans) + (p.atif ? " — " + esc(p.atif) : "") + "</span>" : "");
  $("btn-uydu-kaldir").hidden = false;
}

/* ---- tarayıcı: dosyayı seçmek gerekir (her açılışta) ---- */
async function paketDosyadan(f){
  const SIHIR = "PAFTAUYDU1";
  try {
    const bas = new Uint8Array(await f.slice(0, 14).arrayBuffer());
    if (new TextDecoder().decode(bas.subarray(0, 10)) !== SIHIR) throw new Error("Bu dosya bir PAFTA uydu paketi değil.");
    const n = new DataView(bas.buffer).getUint32(10, true);
    const bilgi = JSON.parse(new TextDecoder().decode(await f.slice(14, 14 + n).arrayBuffer()));
    const veri = 14 + n, dizin = bilgi.doseme;
    bilgi.anahtarlar = Object.keys(dizin);
    bilgi.boyut = f.size; bilgi.dosya = f.name;
    delete bilgi.doseme;
    if (!bilgi.anahtarlar.length) throw new Error("Pakette döşeme yok.");
    paketKur(bilgi, (k, im) => {
      const [o, l] = dizin[k];
      const url = URL.createObjectURL(f.slice(veri + o, veri + o + l, "image/jpeg"));
      im._url = url; im.src = url;
    });
    if (!$("opt-sat").checked) toggleSat();
    toast(bilgi.ad + " yüklendi");
  } catch (e){
    uyar(f.name + " açılamadı.", e.message || String(e));
  }
}

/* ---- exe: yerel sunucudan; son paket hatırlanır ---- */
function paketSunucudan(bilgi){
  if (!bilgi){ paketKur(null); return; }
  const surum = encodeURIComponent((bilgi.dosya || "") + "-" + (bilgi.boyut || 0));
  paketKur(bilgi, (k, im) => { im.src = "__uydu/" + k + "?p=" + surum; });
}

$("btn-uydu-paket").onclick = async () => {
  if (typeof MASAUSTU !== "undefined" && MASAUSTU && MASAUSTU.uyduSec){
    const b = await MASAUSTU.uyduSec();
    if (b){ paketSunucudan(b); if (!$("opt-sat").checked) toggleSat(); toast(b.ad + " yüklendi"); }
    return;
  }
  $("uydu-dosya").value = ""; $("uydu-dosya").click();
};
$("uydu-dosya").onchange = e => { const f = e.target.files[0]; if (f) paketDosyadan(f); };
$("btn-uydu-kaldir").onclick = () => {
  if (typeof MASAUSTU !== "undefined" && MASAUSTU && MASAUSTU.uyduKaldir) MASAUSTU.uyduKaldir();
  paketKur(null);
};
paketDurum();
setTimeout(async () => {                           // exe: önceki oturumun paketi
  if (typeof MASAUSTU !== "undefined" && MASAUSTU && MASAUSTU.uyduPaketi){
    try { const b = await MASAUSTU.uyduPaketi(); if (b) paketSunucudan(b); } catch (e){}
  }
}, 0);
