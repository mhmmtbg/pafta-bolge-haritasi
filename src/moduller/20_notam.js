/* ============ metinden al: NOTAM / NAVTEX / düz metin ============ */

/* Bir satırdaki tüm koordinatlar, sırayla. MGRS/UTM önce ayrılır, kalan metin ortak ayrıştırıcıya gider. */
function satirKoordlari(line){
  const out = [];
  let w = line;
  for (const re of [new RegExp(MGRS_RE.source, "gi"), new RegExp(UTM_RE.source, "gi")]){
    let m;
    while ((m = re.exec(w)) !== null){
      const r = koordBul(m[0]);
      if (r && !r.hata){ out.push({lat: r.lat, lon: r.lon, start: m.index, end: m.index + m[0].length}); w = w.slice(0, m.index) + " ".repeat(m[0].length) + w.slice(m.index + m[0].length); }
    }
  }
  // serbest metinde yalnız yön harfli (K/G/D/B, N/S/E/W) ya da derece işaretli koordinatlar; tarih ve saatler elenir
  const hits = scanCoords(w).filter(h => h.hemi || /[°º]/.test(w.slice(h.start, h.end)));
  for (let k = 0; k + 1 < hits.length; k += 2){
    const p = coordPair([hits[k], hits[k + 1]]);
    if (p) out.push({lat: p.lat, lon: p.lon, start: hits[k].start, end: hits[k + 1].end});
  }
  return out.sort((a, b) => a.start - b.start);
}

const YC = "YAR[IİıiI]?[ÇCçc]AP";
const RADIUS_RES = [
  new RegExp("(\\d+(?:[.,]\\d+)?)\\s*(NM|KM|M|DEN[İI]Z M[İI]L[İI]|K[İI]LOMETRE|METRE)\\b\\.?\\s*(?:RADIUS|" + YC + "|R\\b)", "gi"),
  new RegExp("(?:RADIUS|" + YC + ")\\s*(?:OF\\s*)?[:=]?\\s*(\\d+(?:[.,]\\d+)?)\\s*(NM|KM|M)\\b", "gi"),
  new RegExp("\\b(?:WI|WITHIN)\\s*(\\d+(?:[.,]\\d+)?)\\s*(NM|KM|M)\\b", "gi"),
  new RegExp("(\\d+(?:[.,]\\d+)?)\\s*(NM|KM|M|DEN[İI]Z M[İI]L[İI])\\s*" + YC + "\\w*", "gi")
];
const ALAN_ANAHTAR = /\b(AREA|ALAN|B[ÖO]LGE|SAHA|SECTOR|SEKT[ÖO]R)\b\s*[-:]?\s*([A-Z0-9ÇĞİÖŞÜ]{1,6}(?:[-\/][A-Z0-9]{1,4})?)?/i;
const LIMIT_RE = /\b(SFC|GND|MSL|FL\s?\d{2,3}|\d{3,5}\s?(?:FT|M)\s?(?:AMSL|AGL|MSL)?)\s*(?:-|–|\/|TO|İLA|ILA)\s*(UNL|FL\s?\d{2,3}|\d{3,5}\s?(?:FT|M)\s?(?:AMSL|AGL|MSL)?)\b/i;

function notamCoz(text){
  const satirlar = text.replace(/\r/g, "").split("\n");
  let limit = null;
  const fm = text.match(/\bF\)\s*([^\n]*?)\s+G\)\s*([^\n]+)/);
  if (fm) limit = fm[1].trim().replace(/\s+/g, " ") + "–" + fm[2].trim().replace(/\s+/g, " ").replace(/\.$/, "");
  const lm = text.match(LIMIT_RE);
  if (!limit && lm) limit = lm[1].replace(/\s+/g, " ") + "–" + lm[2].replace(/\s+/g, " ");

  const gruplar = [], daireler = [];
  let cur = null, bekleyenYaricap = null;
  const yeniGrup = ad => { cur = {ad: ad || null, noktalar: []}; gruplar.push(cur); };
  const kapat = () => { cur = null; };

  satirlar.forEach(raw => {
    const line = raw.trim();
    if (!line){ kapat(); return; }
    if (/^Q\)/i.test(line)) return;                                          // NOTAM Q satırı: özet daire, köşe değil
    // yarıçap ifadeleri
    let w = line, yaricaplar = [];
    for (const re of RADIUS_RES){
      re.lastIndex = 0; let m;
      while ((m = re.exec(w)) !== null){
        yaricaplar.push({v: +m[1].replace(",", "."), u: birimAdi(m[2]), at: m.index});
        w = w.slice(0, m.index) + " ".repeat(m[0].length) + w.slice(m.index + m[0].length);
      }
    }
    const ka = line.match(ALAN_ANAHTAR);
    const koordlar = satirKoordlari(w.replace(LIMIT_RE, s => " ".repeat(s.length)));
    if (ka && (koordlar.length || /BOUNDED|ARASINDA|SINIRLI|:\s*$/i.test(line))){
      const ad = ka[2] && !/^(BOUNDED|ACT|ACTIVE)$/i.test(ka[2]) ? ka[1].toUpperCase() + " " + ka[2].toUpperCase() : null;
      kapat(); yeniGrup(ad);
    }
    const kullan = koordlar.slice();
    // daireler: yarıçap ile aynı satırdaki en yakın koordinat ya da sonraki satırın ilk koordinatı
    yaricaplar.forEach(r => {
      if (kullan.length){
        let en = 0;
        kullan.forEach((k, i) => { if (Math.abs(k.start - r.at) < Math.abs(kullan[en].start - r.at)) en = i; });
        const k = kullan.splice(en, 1)[0];
        daireler.push({ad: null, lat: k.lat, lon: k.lon, v: r.v, u: r.u});
      } else bekleyenYaricap = r;
    });
    if (bekleyenYaricap && !yaricaplar.length && kullan.length){
      const k = kullan.shift();
      daireler.push({ad: null, lat: k.lat, lon: k.lon, v: bekleyenYaricap.v, u: bekleyenYaricap.u});
      bekleyenYaricap = null;
    }
    // köşeler
    kullan.forEach(k => {
      if (!cur) yeniGrup(null);
      const ilk = cur.noktalar[0];
      if (ilk && cur.noktalar.length >= 3 && haversine(ilk, k) < 50){ kapat(); return; }   // kapanan dizi
      cur.noktalar.push({lat: k.lat, lon: k.lon});
    });
  });

  const alanlar = [], noktalar = [];
  let na = 0, nn = 0, nd = 0;
  gruplar.filter(g => g.noktalar.length).forEach(g => {
    if (g.noktalar.length >= 3) alanlar.push({ad: (g.ad || "NOTAM alanı " + (++na)) + (limit ? " (" + limit + ")" : ""), noktalar: g.noktalar});
    else g.noktalar.forEach(p => noktalar.push({ad: g.ad || "NOTAM noktası " + (++nn), lat: p.lat, lon: p.lon}));
  });
  daireler.forEach(d => d.ad = "NOTAM dairesi " + (++nd) + (limit ? " (" + limit + ")" : ""));
  return {alanlar, daireler, noktalar, limit};
}

/* ---- pencere ---- */
let NOTAM_SON = null;
function notamOnizle(){
  const r = NOTAM_SON = notamCoz($("notam-text").value);
  const host = $("notam-onizleme");
  host.innerHTML = "";
  const satir = (tur, ad, ayrinti, id) => {
    const l = document.createElement("label");
    l.innerHTML = '<input type="checkbox" checked data-id="' + id + '"><span class="tur">' + tur + '</span><b>' + esc(ad) + '</b><small>' + esc(ayrinti) + '</small>';
    host.appendChild(l);
  };
  r.alanlar.forEach((a, i) => satir("Alan", a.ad, a.noktalar.length + " köşe, ilk: " + fk(a.noktalar[0].lat, a.noktalar[0].lon) +
    ", " + fmtArea(sphericalArea(a.noktalar)), "a" + i));
  r.daireler.forEach((d, i) => satir("Daire", d.ad, yaricapEtiketi(d.v, d.u) + ", merkez " + fk(d.lat, d.lon), "d" + i));
  r.noktalar.forEach((n, i) => satir("Nokta", n.ad, fk(n.lat, n.lon), "n" + i));
  const toplam = r.alanlar.length + r.daireler.length + r.noktalar.length;
  if (!toplam && $("notam-text").value.trim()) host.innerHTML = '<div class="bos">Metinde okunabilir koordinat bulunamadı.</div>';
  $("notam-ekle").disabled = !toplam;
}
function notamEkle(){
  const r = NOTAM_SON; if (!r) return;
  const secili = new Set([...$("notam-onizleme").querySelectorAll("input:checked")].map(i => i.dataset.id));
  const ekle = (id, metin) => { const t = $(id); t.value = t.value.replace(/\s+$/, "") + (t.value.trim() ? "\n\n" : "") + metin; t.dispatchEvent(new Event("input", {bubbles: true})); };
  const A = r.alanlar.filter((_, i) => secili.has("a" + i)), D = r.daireler.filter((_, i) => secili.has("d" + i)), N = r.noktalar.filter((_, i) => secili.has("n" + i));
  if (A.length){ ekle("input", A.map(a => a.noktalar.map((p, i) => (i ? "" : a.ad) + "\t" + (i + 1) + "\t" + fk(p.lat, p.lon, "\t")).join("\n")).join("\n\n")); build(); }
  if (D.length){ ekle("c-center", D.map(d => d.ad + "\t" + fk(d.lat, d.lon, "\t") + "\t" + yaricapEtiketi(d.v, d.u).replace(/\./g, "")).join("\n")); buildCircles(); }
  if (N.length){ ekle("p-input", N.map(n => n.ad + "\t" + fk(n.lat, n.lon, "\t")).join("\n")); buildPoints(); }
  $("notam").hidden = true;
  sekmeAc(A.length ? "pane-areas" : D.length ? "pane-circles" : "pane-points");
  SUPPRESS_FIT = false; fitAll();
  toast([A.length && A.length + " alan", D.length && D.length + " daire", N.length && N.length + " nokta"].filter(Boolean).join(", ") + " eklendi");
}
$("btn-notam").onclick = () => { $("notam").hidden = false; $("notam-text").focus(); notamOnizle(); };
$("notam-text").addEventListener("input", notamOnizle);
$("notam-ekle").onclick = notamEkle;
[$("notam-x"), $("notam-iptal")].forEach(b => b.onclick = () => { $("notam").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("notam").hidden){ e.stopPropagation(); $("notam").hidden = true; } }, true);
