/* ============ KML / KMZ'den al ============ */
/* Google Earth ve benzerlerinden gelen .kml ve .kmz (ZIP içinde doc.kml) dosyaları okunur.
   Poligonlar alan, noktalar nokta, çizgiler Notlar'da çizgi olur; daireye benzeyen kapalı halkalar
   (PAFTA'nın kendi KML çıktısındaki daireler dahil) daire olarak tanınır. Her öğenin nereye
   ekleneceği önizlemede değiştirilebilir; renkler KML stillerinden alınır. */

const KML_SINIR = 400;              // bir alan ya da çizgide en çok köşe (fazlası sadeleştirilir)
let KML_SON = null;                  // {ad, ogeler}

/* ---- KML rengi aabbggrr -> #rrggbb; beyaza yakın ve tamamen saydam renkler yok sayılır ---- */
function kmlRengi(t){
  t = (t || "").trim().replace(/^#/, "");
  if (!/^[0-9a-f]{8}$/i.test(t)) return null;
  const a = parseInt(t.slice(0, 2), 16), r = t.slice(6, 8), g = t.slice(4, 6), b = t.slice(2, 4);
  if (a < 40) return null;
  const h = "#" + (r + g + b).toLowerCase();
  const n = parseInt(r + g + b, 16), L = (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3;
  return L > 235 ? null : h;
}

/* ---- stiller: id -> {cizgi, dolgu, ikon, kalinlik}; StyleMap "normal" eşine çözülür ---- */
function kmlStilOku(el){                          // yalnız bulunan alanlar döner
  const r = {};
  const ls = xmlEtiket(el, "LineStyle")[0], ps = xmlEtiket(el, "PolyStyle")[0], is = xmlEtiket(el, "IconStyle")[0];
  const renk = s => { const c = s && xmlEtiket(s, "color")[0]; return c ? kmlRengi(c.textContent) : null; };
  const c = renk(ls), d = renk(ps), i = renk(is);
  if (c) r.cizgi = c; if (d) r.dolgu = d; if (i) r.ikon = i;
  const w = ls && xmlEtiket(ls, "width")[0];
  if (w && +w.textContent > 0) r.kalinlik = +w.textContent;
  return r;
}
function kmlStiller(doc){
  const tek = kmlStilOku;
  const S = {}, M = {};
  xmlEtiket(doc, "Style").forEach(s => { const id = s.getAttribute("id"); if (id) S[id] = tek(s); });
  xmlEtiket(doc, "StyleMap").forEach(m => {
    const id = m.getAttribute("id"); if (!id) return;
    const cift = xmlEtiket(m, "Pair").find(p => (xmlEtiket(p, "key")[0] || {}).textContent === "normal") || xmlEtiket(m, "Pair")[0];
    const url = cift && xmlEtiket(cift, "styleUrl")[0];
    if (url) M[id] = url.textContent.trim().replace(/^.*#/, "");
  });
  return url => { if (!url) return {}; const id = url.trim().replace(/^.*#/, ""); return S[M[id] || id] || {}; };
}

function kmlKoordlar(el){
  const c = el && xmlEtiket(el, "coordinates")[0];
  if (!c) return [];
  return c.textContent.trim().split(/\s+/).map(t => t.split(",")).filter(p => p.length >= 2)
    .map(p => ({lon: +p[0], lat: +p[1]})).filter(p => isFinite(p.lat) && isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180);
}

/* ---- sadeleştirme: köşe sayısı sınırın altına inene dek Douglas–Peucker toleransını büyüt ---- */
function kmlSadelestir(pts, sinir){
  if (pts.length <= sinir) return pts;
  const rdp = eps => {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length){
      const [s, e] = st.pop(); if (e <= s + 1) continue;
      const k = Math.cos(rad((pts[s].lat + pts[e].lat) / 2));
      const ax = pts[s].lon * k, ay = pts[s].lat, dx = pts[e].lon * k - ax, dy = pts[e].lat - ay, L = dx * dx + dy * dy;
      let en = -1, ei = -1;
      for (let i = s + 1; i < e; i++){
        const px = pts[i].lon * k - ax, py = pts[i].lat - ay;
        const t = L ? clamp((px * dx + py * dy) / L, 0, 1) : 0;
        const d = Math.hypot(px - t * dx, py - t * dy);
        if (d > en){ en = d; ei = i; }
      }
      if (en > eps){ keep[ei] = 1; st.push([s, ei], [ei, e]); }
    }
    return pts.filter((_, i) => keep[i]);
  };
  let lo = 0, hi = 1, out = rdp(hi);
  for (let i = 0; i < 30; i++){ const m = (lo + hi) / 2, r = rdp(m); if (r.length > sinir) lo = m; else { hi = m; out = r; } }
  return out;
}

/* ---- daire tanıma: kapalı, çok köşeli, köşeleri bir merkezden eşit uzaklıkta ---- */
function kmlDaireMi(pts, ad){
  if (pts.length < 24) return null;
  const v = pts.map(p => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))]);
  const m = v.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]), n = Math.hypot(...m);
  if (n < 1e-9) return null;
  const merkez = {lat: Math.asin(m[2] / n) * 180 / Math.PI, lon: Math.atan2(m[1], m[0]) * 180 / Math.PI};
  const d = pts.map(p => haversine(merkez, p)), ort = d.reduce((a, b) => a + b, 0) / d.length;
  if (ort < 50) return null;
  const sap = Math.max(...d.map(x => Math.abs(x - ort))) / ort;
  if (sap > 0.006) return null;
  // ad "… — 150 km" biçimindeyse yarıçap ondan, yoksa ölçülen değerden (km ya da NM'de yuvarlak olanı)
  const m2 = (ad || "").match(/(\d+(?:[.,]\d+)?)\s*(km|nm|NM|m)\b\s*$/);
  let v_, u;
  if (m2){ v_ = +m2[1].replace(",", "."); u = birimAdi(m2[2]); }
  else {
    const km = ort / 1000, nm = ort / 1852;
    if (Math.abs(nm - Math.round(nm)) < 0.02 * Math.max(1, nm) && Math.abs(km - Math.round(km)) > Math.abs(nm - Math.round(nm)) * 1.852){ v_ = Math.round(nm); u = "nm"; }
    else { v_ = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10; u = "km"; }
  }
  return {lat: merkez.lat, lon: merkez.lon, v: v_, u};
}

/* ---- KML belgesi -> öğeler ---- */
function kmlCoz(metin){
  const doc = new DOMParser().parseFromString(metin, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("KML dosyası okunamadı (XML hatalı).");
  const stil = kmlStiller(doc), ogeler = [];
  let adsiz = 0;
  xmlEtiket(doc, "Placemark").forEach(pm => {
    const adEl = [...pm.children].find(c => c.localName === "name");
    let ad = adEl ? adEl.textContent.trim().replace(/\s+/g, " ") : "";
    if (!ad){
      const kl = pm.parentElement && [...pm.parentElement.children].find(c => c.localName === "name");
      ad = (kl ? kl.textContent.trim() + " " : "Öğe ") + (++adsiz);
    }
    const ic = xmlEtiket(pm, "Style")[0], url = xmlEtiket(pm, "styleUrl")[0];
    const st = Object.assign({}, stil(url && url.textContent), ic ? kmlStilOku(ic) : {});   // satır içi stil paylaşılanı ezer
    const geo = [];
    const topla = el => {
      [...el.children].forEach(c => {
        if (c.localName === "MultiGeometry") topla(c);
        else if (["Point", "LineString", "LinearRing", "Polygon"].includes(c.localName)) geo.push(c);
      });
    };
    topla(pm);
    geo.forEach((g, gi) => {
      const ad2 = geo.length > 1 ? ad + " (" + (gi + 1) + ")" : ad;
      let pts, tur;
      if (g.localName === "Point"){ pts = kmlKoordlar(g); if (pts.length) ogeler.push({geo: "nokta", ad: ad2, pts: pts.slice(0, 1), renk: st.ikon || st.cizgi, hedef: "nokta"}); return; }
      if (g.localName === "Polygon"){
        const dis = xmlEtiket(g, "outerBoundaryIs")[0] || g;
        pts = kmlKoordlar(xmlEtiket(dis, "LinearRing")[0] || dis); tur = "poligon";
        var bosluk = xmlEtiket(g, "innerBoundaryIs").length;
      } else { pts = kmlKoordlar(g); tur = g.localName === "LinearRing" ? "poligon" : "cizgi"; }
      if (pts.length < 2) return;
      const kapali = pts.length > 3 && haversine(pts[0], pts[pts.length - 1]) < 1;
      if (kapali){ pts = pts.slice(0, -1); if (tur === "cizgi") tur = "kapali"; }
      const daire = (tur === "poligon" || tur === "kapali") ? kmlDaireMi(pts, ad2) : null;
      const ham = pts.length;
      if (!daire) pts = kmlSadelestir(pts, KML_SINIR);
      const o = {geo: daire ? "daire" : tur, ad: daire ? ad2.replace(/\s*[—–-]\s*\d+(?:[.,]\d+)?\s*(km|nm|NM|m)\s*$/, "") || ad2 : ad2,
                 pts, ham, renk: st.cizgi || st.dolgu, kalinlik: st.kalinlik, daire, bosluk: g.localName === "Polygon" ? bosluk : 0,
                 hedef: daire ? "daire" : tur === "poligon" && pts.length >= 3 ? "alan" : "cizgi"};
      ogeler.push(o);
    });
  });
  return pafatOlcumleri(ogeler);
}

/* PAFTA'nın kendi KML çıktısındaki ölçüm hatları: "H1-2 Ad" noktalarından hat yeniden kurulur,
   büyük daire yayıyla sıklaştırılmış "Ölçüm hattı 1 — …" çizgisi atlanır */
function pafatOlcumleri(ogeler){
  const hat = {};
  ogeler.forEach(o => {
    const m = o.geo === "nokta" && o.ad.match(/^H(\d+)-(\d+)(?:\s+(.*))?$/);
    if (m) (hat[m[1]] = hat[m[1]] || []).push({i: +m[2], lat: o.pts[0].lat, lon: o.pts[0].lon, name: m[3] || null, o});
  });
  const no = Object.keys(hat).filter(k => hat[k].length >= 2);
  if (!no.length) return ogeler;
  const at = new Set();
  const yeni = no.map(k => {
    const pts = hat[k].sort((a, b) => a.i - b.i);
    pts.forEach(p => at.add(p.o));
    const cizgi = ogeler.find(o => o.geo === "cizgi" && new RegExp("^Ölçüm hattı " + k + "\\b").test(o.ad));
    if (cizgi) at.add(cizgi);
    return {geo: "olcum", ad: "Ölçüm hattı " + k, pts: pts.map(p => ({lat: p.lat, lon: p.lon, name: p.name})), ham: pts.length,
            renk: cizgi && cizgi.renk, hedef: "olcum"};
  });
  return ogeler.filter(o => !at.has(o)).concat(yeni);
}

/* ---- dosya: .kml metin, .kmz ZIP (doc.kml ya da ilk .kml) ---- */
async function kmlDosyasi(f){
  if (/\.kmz$/i.test(f.name)){
    const z = zipAc(await f.arrayBuffer());
    const ad = z.var("doc.kml") ? "doc.kml" : z.adlar().find(a => /\.kml$/i.test(a));
    if (!ad) throw new Error("KMZ içinde KML dosyası bulunamadı.");
    return z.metin(ad);
  }
  return await f.text();
}

/* ---- pencere ---- */
const KML_HEDEFLER = {
  nokta:   [["nokta", "Nokta"], ["not", "Not"], ["", "Alma"]],
  poligon: [["alan", "Alan"], ["cizgi", "Çizgi"], ["", "Alma"]],
  kapali:  [["alan", "Alan"], ["cizgi", "Çizgi"], ["olcum", "Ölçüm hattı"], ["", "Alma"]],
  cizgi:   [["cizgi", "Çizgi"], ["olcum", "Ölçüm hattı"], ["alan", "Alan"], ["", "Alma"]],
  daire:   [["daire", "Daire"], ["alan", "Alan"], ["cizgi", "Çizgi"], ["", "Alma"]],
  olcum:   [["olcum", "Ölçüm hattı"], ["cizgi", "Çizgi"], ["", "Alma"]]
};
const KML_TUR_ADI = {nokta: "Nokta", poligon: "Poligon", kapali: "Kapalı çizgi", cizgi: "Çizgi", daire: "Daire", olcum: "Ölçüm hattı"};

function kmlOnizle(){
  const host = $("kml-liste"), O = KML_SON.ogeler;
  host.innerHTML = "";
  const gos = O.slice(0, 800);
  gos.forEach((o, i) => {
    const r = document.createElement("div");
    r.className = "kml-satir";
    const sec = document.createElement("select");
    sec.innerHTML = KML_HEDEFLER[o.geo].filter(h => !(h[0] === "alan" && o.pts.length < 3)).map(h => '<option value="' + h[0] + '">' + h[1] + "</option>").join("");
    sec.value = o.hedef; sec.onchange = () => { o.hedef = sec.value; kmlSay(); };
    const ayr = o.geo === "nokta" ? fk(o.pts[0].lat, o.pts[0].lon)
      : o.geo === "daire" ? yaricapEtiketi(o.daire.v, o.daire.u) + ", merkez " + fk(o.daire.lat, o.daire.lon)
      : o.pts.length + " köşe" + (o.ham > o.pts.length ? " (" + o.ham.toLocaleString("tr-TR") + " köşeden sadeleştirildi)" : "") +
        (o.geo !== "cizgi" && o.pts.length >= 3 ? ", " + fmtArea(sphericalArea(o.pts)) : ", " + fmtDist(o.pts.reduce((s, p, k) => k ? s + haversine(o.pts[k - 1], p) : 0, 0))) +
        (o.bosluk ? ", iç boşluk (" + o.bosluk + ") alınmaz" : "");
    r.innerHTML = '<i style="background:' + (o.renk || "transparent") + '"></i><span class="tur">' + KML_TUR_ADI[o.geo] + "</span><b>" + esc(o.ad) + "</b><small>" + esc(ayr) + "</small>";
    r.appendChild(sec);
    host.appendChild(r);
  });
  if (O.length > gos.length) host.insertAdjacentHTML("beforeend", '<div class="bos">… ve ' + (O.length - gos.length).toLocaleString("tr-TR") + " öğe daha (önerilen yerlerine eklenir)</div>");
  if (!O.length) host.innerHTML = '<div class="bos">Dosyada okunabilir yer işareti (Placemark) bulunamadı.</div>';
  kmlSay();
}
function kmlSay(){
  const n = {}; KML_SON.ogeler.forEach(o => { if (o.hedef) n[o.hedef] = (n[o.hedef] || 0) + 1; });
  const ad = {alan: "alan", daire: "daire", nokta: "nokta", not: "not", cizgi: "çizgi", olcum: "ölçüm hattı"};
  const t = Object.keys(ad).filter(k => n[k]).map(k => n[k].toLocaleString("tr-TR") + " " + ad[k]);
  $("kml-ozet").textContent = t.length ? "Eklenecek: " + t.join(", ") : "Eklenecek öğe seçilmedi.";
  $("kml-ekle").disabled = !t.length;
}
function kmlTopluHedef(geo, hedef){
  KML_SON.ogeler.forEach(o => { if (o.geo === geo && KML_HEDEFLER[geo].some(h => h[0] === hedef) && !(hedef === "alan" && o.pts.length < 3)) o.hedef = hedef; });
  kmlOnizle();
}

function kmlEkle(){
  const O = KML_SON.ogeler.filter(o => o.hedef), renkli = $("kml-renk").checked, degistir = $("kml-degistir").checked;
  const yaz = (id, metin, ayir) => {
    const t = $(id);
    t.value = degistir || !t.value.trim() ? metin : t.value.replace(/\s+$/, "") + (ayir ? "\n\n" : "\n") + metin;
    t.dispatchEvent(new Event("input", {bubbles: true}));
  };
  const kk = p => fk(p.lat, p.lon, "\t", null, true);
  const temizAd = s => s.replace(/[\t\r\n]+/g, " ").replace(/#[0-9a-f]{6}\b/gi, "").trim() || "Öğe";
  const A = O.filter(o => o.hedef === "alan"), D = O.filter(o => o.hedef === "daire"), N = O.filter(o => o.hedef === "nokta");
  const C = O.filter(o => o.hedef === "cizgi" || o.hedef === "not"), M = O.filter(o => o.hedef === "olcum");
  SUPPRESS_FIT = true;
  try {
    if (A.length){
      // aynı adlı alanlar ayrı kalsın: tekrar eden adlara sıra eklenir
      const say = {};
      const ad = o => { const a = temizAd(o.ad); say[a] = (say[a] || 0) + 1; return say[a] > 1 ? a + " " + say[a] : a; };
      const adlar = A.map(ad);
      yaz("input", A.map((o, i) => (o.geo === "daire" ? geodesicRingPts(o.daire) : o.pts).map((p, k) => (k ? "" : adlar[i]) + "\t" + (k + 1) + "\t" + kk(p)).join("\n")).join("\n\n"), true);
      build();
      if (renkli) A.forEach((o, i) => { const z = [...ZONES].reverse().find(z => z.name === adlar[i]); if (z && o.renk) z.color = o.renk; });
      renderZoneList();
    }
    if (D.length){
      // aynı adlı merkezler (ör. bir merkezin 150 ve 300 km halkaları) boş satırla ayrılır: her satır kendi yarıçapıyla
      yaz("c-center", D.map((o, i) => (i && temizAd(D[i - 1].ad) === temizAd(o.ad) ? "\n" : "") + temizAd(o.ad) + "\t" + kk(o.daire) + "\t" + yaricapEtiketi(o.daire.v, o.daire.u).replace(/\./g, "")).join("\n"));
      buildCircles();
      if (renkli) D.forEach(o => { if (o.renk) CIRCLES.forEach(c => { if (c.label === yaricapEtiketi(o.daire.v, o.daire.u)) c.color = o.renk; }); });
      circleList();
    }
    if (N.length){
      yaz("p-input", N.map(o => temizAd(o.ad) + "\t" + kk(o.pts[0]) + (renkli && o.renk ? "\t" + o.renk : "")).join("\n"));
      buildPoints();
    }
    const nr = $("n-renk").value;
    C.forEach(o => {
      if (o.hedef === "not") NOTLAR.push({tur: "not", lat: o.pts[0].lat, lon: o.pts[0].lon, metin: o.ad, renk: renkli && o.renk || nr, boyut: 13});
      else {
        const pts = o.geo === "daire" ? geodesicRingPts(o.daire) : o.pts.slice();
        if (o.geo !== "cizgi") pts.push(pts[0]);                  // kapalı şekil kapalı kalsın
        const w = o.kalinlik || 2.5;
        NOTLAR.push({tur: "cizgi", pts, metin: o.ad, renk: renkli && o.renk || nr, boyut: 13, tip: "duz", kalinlik: w <= 2 ? 1.5 : w <= 3 ? 2.5 : 4});
      }
    });
    if (C.length){ notListe(); hideEmpty(); }
    M.forEach(o => {
      newChain();
      const ch = MEASURE[MEASURE.length - 1];
      if (renkli && o.renk) ch.color = o.renk;
      if (o.geo === "olcum") o.pts.forEach(p => ch.pts.push({lat: p.lat, lon: p.lon, name: p.name}));
      else kmlSadelestir(o.pts, 60).forEach((p, k) => ch.pts.push({lat: p.lat, lon: p.lon, name: k ? null : o.ad}));
    });
    if (M.length){ measureList(); hideEmpty(); }
  } finally { SUPPRESS_FIT = false; }
  $("kml").hidden = true;
  degisti();
  sekmeAc(A.length ? "pane-areas" : D.length ? "pane-circles" : N.length ? "pane-points" : C.length ? "pane-notes" : "pane-measure");
  fitAll();
  toast(KML_SON.ad + ": " + O.length.toLocaleString("tr-TR") + " öğe eklendi");
}
/* daire alana/çizgiye çevrilirken: 72 köşeli jeodezik halka */
function geodesicRingPts(d){
  const r = geodesicRing(d.lat, d.lon, d.v * UNIT_M[d.u], 72), out = [];
  for (let i = 0; i < r.length - 2; i += 2) out.push({lat: r[i + 1], lon: r[i]});
  return out;
}

async function kmlAc(f){
  let metin;
  try { metin = await kmlDosyasi(f); KML_SON = {ad: f.name, ogeler: kmlCoz(metin)}; }
  catch (e){ uyar(f.name + " okunamadı.", (e && e.message) || "Dosya bozuk ya da desteklenmeyen bir biçimde."); return; }
  $("kml-dosya").textContent = f.name;
  const sayi = {}; KML_SON.ogeler.forEach(o => sayi[o.geo] = (sayi[o.geo] || 0) + 1);
  $("kml-toplu").innerHTML = Object.keys(sayi).length < 1 ? "" : "<span>Hepsini:</span>" + Object.keys(sayi).map(g => '<label>' + KML_TUR_ADI[g] + " (" + sayi[g].toLocaleString("tr-TR") + ') <select data-geo="' + g + '"><option value="-">…</option>' +
    KML_HEDEFLER[g].map(h => '<option value="' + h[0] + '">' + h[1] + "</option>").join("") + "</select></label>").join("");
  $("kml-toplu").querySelectorAll("select").forEach(s => s.onchange = () => { if (s.value !== "-") kmlTopluHedef(s.dataset.geo, s.value); s.value = "-"; });
  $("kml-degistir").checked = false;
  kmlOnizle();
  $("kml").hidden = false;
}

$("kml-ekle").onclick = kmlEkle;
[$("kml-x"), $("kml-iptal")].forEach(b => b.onclick = () => { $("kml").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("kml").hidden){ e.stopPropagation(); $("kml").hidden = true; } }, true);
