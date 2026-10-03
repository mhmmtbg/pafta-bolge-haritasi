/* ============ il / ilçe sorgusu ve alan raporu ============ */

/* ---- ilçe poligonları: ortak zincirlerden kurulur (ilk kullanımda) ---- */
var ILCE_POLI = null;
function ilcePoligonlari(){
  if (ILCE_POLI) return ILCE_POLI;
  const Z = TR_ADM.zincir;
  ILCE_POLI = TR_ADM.ilceHalka.map(hl => {
    const halkalar = hl.map(h => {
      const out = [];
      h.forEach(s => {
        const z = Z[Math.abs(s) - 1], n = z.length / 2;
        for (let k = 0; k < n; k++){ const i = s > 0 ? k : n - 1 - k; out.push(z[2 * i], z[2 * i + 1]); }
      });
      return out;
    });
    const bb = [1e9, 1e9, -1e9, -1e9];
    halkalar.forEach(r => { const b = bbOf(r); bb[0] = Math.min(bb[0], b[0]); bb[1] = Math.min(bb[1], b[1]); bb[2] = Math.max(bb[2], b[2]); bb[3] = Math.max(bb[3], b[3]); });
    return {halkalar, bb};
  });
  return ILCE_POLI;
}
/* çift-tek kuralı; halkalar düz [boylam, enlem, ...] dizileri */
function halkalarIcinde(halkalar, lon, lat){
  let ic = false;
  for (const r of halkalar){
    const n = r.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2){
      const yi = r[i + 1], yj = r[j + 1];
      if ((yi > lat) !== (yj > lat) && lon < (r[j] - r[i]) * (lat - yi) / (yj - yi) + r[i]) ic = !ic;
    }
  }
  return ic;
}
function ilIlceBul(lat, lon){
  if (lon < 25.5 || lon > 45 || lat < 35.7 || lat > 42.2) return null;
  const P = ilcePoligonlari();
  for (let i = 0; i < P.length; i++){
    const b = P[i].bb;
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    if (halkalarIcinde(P[i].halkalar, lon, lat)){
      const c = TR_ADM.ilce[i];
      return {il: TR_ADM.il[c[1]][0], ilce: c[0], i};
    }
  }
  return null;
}

/* ---- geometri yardımcıları ---- */
function sikHalka(pts, adimM){                     // kenarları en çok adimM aralıkla böl (doğrusal enlem/boylam)
  const out = [];
  for (let i = 0; i < pts.length; i++){
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.min(200, Math.max(1, Math.ceil(haversine(a, b) / adimM)));
    for (let k = 0; k < n; k++) out.push({lat: a.lat + (b.lat - a.lat) * k / n, lon: a.lon + (b.lon - a.lon) * k / n});
  }
  return out;
}
/* p noktasından [a,b] doğru parçasına, p çevresinde yerel eşdikdörtgen düzlemde uzaklık (m) */
function parcaUzakligi(p, ax, ay, bx, by){
  const k = Math.cos(rad(p.lat)), M = Math.PI / 180 * R_EARTH;
  const x1 = (ax - p.lon) * k, y1 = ay - p.lat, x2 = (bx - p.lon) * k, y2 = by - p.lat;
  const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / L)) : 0;
  return Math.hypot(x1 + t * dx, y1 + t * dy) * M;
}
/* sık noktalar ile halkalar (düz diziler) arası en kısa uzaklık ve en yakın nokta */
function enYakin(noktalar, halkalar){
  let en = Infinity, yer = null;
  for (const p of noktalar){
    for (const r of halkalar){
      const n = r.length;
      for (let i = 0, j = n - 2; i < n; j = i, i += 2){
        const d = parcaUzakligi(p, r[j], r[j + 1], r[i], r[i + 1]);
        if (d < en){ en = d; yer = p; }
      }
    }
  }
  return {d: en, p: yer};
}
const duzHalka = pts => pts.flatMap(p => [p.lon, p.lat]);

/* ---- alan örnekleme: içerideki ızgara noktaları, ağırlık cos(enlem) ---- */
function alanOrnekle(pts){
  const halka = [duzHalka(pts)], bb = bbOf(halka[0]);
  const k0 = Math.cos(rad((bb[1] + bb[3]) / 2));
  let hedef = 2500, ornek = [];
  for (let tur = 0; tur < 4; tur++){
    const gen = Math.max(1e-6, (bb[2] - bb[0]) * k0), yuk = Math.max(1e-6, bb[3] - bb[1]);
    const adim = Math.sqrt(gen * yuk / hedef);
    const nx = Math.max(1, Math.ceil(gen / adim)), ny = Math.max(1, Math.ceil(yuk / adim));
    ornek = [];
    for (let iy = 0; iy < ny; iy++){
      const lat = bb[1] + (iy + .5) * (bb[3] - bb[1]) / ny;
      for (let ix = 0; ix < nx; ix++){
        const lon = bb[0] + (ix + .5) * (bb[2] - bb[0]) / nx;
        if (halkalarIcinde(halka, lon, lat)) ornek.push({lat, lon, w: Math.cos(rad(lat))});
      }
    }
    if (ornek.length >= 400) break;
    hedef *= 4;
  }
  if (!ornek.length) pts.forEach(p => ornek.push({lat: p.lat, lon: p.lon, w: Math.cos(rad(p.lat))}));   // çok ince alan
  return ornek;
}

function mvHalkalari(){
  if ($("r-mv").checked && $("r-mv-src").value === "own"){
    const own = parseText($("r-mv-text").value).zones.filter(z => z.points.length > 2).map(z => duzHalka(z.points));
    if (own.length) return {halkalar: own, ad: "Mavi Vatan (kendi koordinatlarınız)"};
  }
  return {halkalar: MAVI_VATAN, ad: "Mavi Vatan (gömülü rekonstrüksiyon)"};
}

/* ---- rapor ---- */
function alanRaporu(z, mv){
  const pts = z.points, ornek = alanOrnekle(pts), halka = duzHalka(pts), bb = bbOf(halka);
  const firAday = FIR.map((f, i) => i).filter(i => { const b = FIR_BB[i]; return !(b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]); });
  const fir = new Map(), ilce = new Map();
  let top = 0, kara = 0, mvIc = 0, cx = 0, cy = 0;
  ornek.forEach(o => {
    top += o.w; cx += o.lon * o.w; cy += o.lat * o.w;
    const f = firAday.find(i => firContains(FIR[i], o.lon, o.lat));
    const fk_ = f == null ? "FIR dışı" : FIR[f][0];
    fir.set(fk_, (fir.get(fk_) || 0) + o.w);
    if (halkalarIcinde(TR, o.lon, o.lat)){
      kara += o.w;
      const y = ilIlceBul(o.lat, o.lon);
      if (y){ const k = y.il + " / " + y.ilce; ilce.set(k, (ilce.get(k) || 0) + o.w); }
    }
    if (halkalarIcinde(mv.halkalar, o.lon, o.lat)) mvIc += o.w;
  });
  const yuzde = v => Math.round(v / top * 1000) / 10;
  const firler = [...fir.entries()].sort((a, b) => b[1] - a[1]).map(([kod, w]) => {
    const f = FIR.find(x => x[0] === kod);
    return {kod, ad: f ? f[5][0] : kod, yuzde: yuzde(w)};
  });
  const ilceler = [...ilce.entries()].sort((a, b) => b[1] - a[1]).map(([ad, w]) => ({ad, yuzde: yuzde(w)}));
  const sik = sikHalka(pts, 2000);
  let trUzak = null;
  if (!kara && !pts.some(p => halkalarIcinde(TR, p.lon, p.lat))){
    const e = enYakin(sik.length > 600 ? sik.filter((_, i) => i % Math.ceil(sik.length / 600) === 0) : sik, TR);
    trUzak = e.d;
  }
  return {
    z, alan: sphericalArea(pts), cevre: perimeter(pts), merkez: {lat: cy / top, lon: cx / top},
    firler, ilceler, karaYuzde: yuzde(kara), mvYuzde: yuzde(mvIc), trUzak, sik
  };
}
/* iki alan arası en kısa mesafe; kesişiyor ya da biri ötekini içeriyorsa 0 */
function alanlarArasi(a, b){
  const ha = [duzHalka(a.z.points)], hb = [duzHalka(b.z.points)];
  if (a.z.points.some(p => halkalarIcinde(hb, p.lon, p.lat)) || b.z.points.some(p => halkalarIcinde(ha, p.lon, p.lat))) return 0;
  const seyrek = s => s.length > 400 ? s.filter((_, i) => i % Math.ceil(s.length / 400) === 0) : s;
  return Math.min(enYakin(seyrek(a.sik), hb).d, enYakin(seyrek(b.sik), ha).d);
}

const kmNm = m => m == null ? "—" : m < 1 ? "0" : (m / 1000).toLocaleString("tr-TR", {maximumFractionDigits: 1}) + " km  ·  " + (m / 1852).toLocaleString("tr-TR", {maximumFractionDigits: 1}) + " NM";
const yzd = v => v.toLocaleString("tr-TR") + "\u00a0%";

let RAPOR = null;
function raporOlustur(){
  const alanlar = ZONES.filter(z => z.points.length > 2);
  if (!alanlar.length){ toast("Raporlanacak alan yok: en az 3 köşeli bir alan çizin.", true); return; }
  const mv = mvHalkalari();
  const r = alanlar.map(z => alanRaporu(z, mv));
  const mesafe = r.map((a, i) => r.map((b, j) => i === j ? 0 : j < i ? null : alanlarArasi(a, b)));
  mesafe.forEach((row, i) => row.forEach((v, j) => { if (v == null) mesafe[i][j] = mesafe[j][i]; }));
  RAPOR = {r, mesafe, mv};
  const host = $("rapor-icerik");
  host.innerHTML = "";
  r.forEach(a => {
    const kart = document.createElement("section");
    kart.className = "rapor-alan";
    const satir = (k, v) => "<dt>" + esc(k) + "</dt><dd>" + v + "</dd>";
    const ilce = a.ilceler.length
      ? a.ilceler.slice(0, 12).map(x => esc(x.ad) + ' <small>' + yzd(x.yuzde) + "</small>").join("<br>") + (a.ilceler.length > 12 ? "<br><small>… " + (a.ilceler.length - 12) + " ilçe daha</small>" : "")
      : '<span class="dim">Türkiye karasında değil</span>';
    kart.innerHTML = '<h3><i style="background:' + a.z.color + '"></i>' + esc(a.z.name) + "</h3><dl>" +
      satir("Alan, çevre", fmtArea(a.alan) + ", " + fmtLen(a.cevre) + " (" + (a.cevre / 1852).toLocaleString("tr-TR", {maximumFractionDigits: 1}) + " NM)") +
      satir("Köşe", a.z.points.length) +
      satir("Ağırlık merkezi", '<span class="mono">' + esc(fk(a.merkez.lat, a.merkez.lon)) + "</span>") +
      satir("FIR", a.firler.map(f => esc(f.ad) + (f.kod !== "FIR dışı" ? " <small>" + esc(f.kod) + "</small>" : "") + " <small>" + yzd(f.yuzde) + "</small>").join("<br>")) +
      satir("Türkiye karası", yzd(a.karaYuzde)) +
      satir("İl / ilçe", ilce) +
      satir("Türkiye'ye en yakın", a.trUzak == null ? '<span class="dim">Türkiye karasına değiyor</span>' : kmNm(a.trUzak)) +
      satir("Mavi Vatan içinde", yzd(a.mvYuzde)) + "</dl>";
    host.appendChild(kart);
  });
  if (r.length > 1){
    const t = document.createElement("section");
    t.className = "rapor-mesafe";
    t.innerHTML = "<h3>Alanlar arası en kısa mesafe</h3><div class=\"tablo\"><table><tr><th></th>" + r.map(a => "<th>" + esc(a.z.name) + "</th>").join("") + "</tr>" +
      r.map((a, i) => "<tr><th>" + esc(a.z.name) + "</th>" + r.map((_, j) => i === j ? "<td class=\"dim\">—</td>" : "<td>" + (mesafe[i][j] < 1 ? "kesişiyor" : kmNm(mesafe[i][j]).replace("  ·  ", "<br>")) + "</td>").join("") + "</tr>").join("") +
      "</table></div>";
    host.appendChild(t);
  }
  $("rapor-not").textContent = "Yüzdeler alan içindeki düzenli örnek noktalardan hesaplanır (alan başına yüzlerce ile binlerce nokta). " +
    "Kara ve kıyı: Natural Earth 1:10m; il/ilçe: OpenStreetMap; " + mv.ad + ". Bilgi amaçlıdır.";
  $("rapor").hidden = false;
}

function raporExcel(){
  const R = RAPOR; if (!R) return;
  const b = kBicim(), tek = b === "utm" || b === "mgrs";
  const ondalik = v => Math.round(v * 1e6) / 1e6, km = m => m == null ? "" : Math.round(m / 100) / 10, nm = m => m == null ? "" : Math.round(m / 185.2) / 10;
  const ozet = [["Alan", "Köşe", "Alan (km²)", "Çevre (km)", "Çevre (NM)", "Merkez enlem", "Merkez boylam", "FIR", "Türkiye karası (%)", "İl / ilçe (%)", "Türkiye'ye en yakın (km)", "Türkiye'ye en yakın (NM)", "Mavi Vatan içinde (%)"]];
  R.r.forEach(a => ozet.push([a.z.name, a.z.points.length, Math.round(a.alan / 1e4) / 100, Math.round(a.cevre / 10) / 100, Math.round(a.cevre / 18.52) / 100,
    ondalik(a.merkez.lat), ondalik(a.merkez.lon),
    a.firler.map(f => f.ad + (f.kod !== "FIR dışı" ? " (" + f.kod + ")" : "") + " " + f.yuzde + "%").join("\n"),
    a.karaYuzde, a.ilceler.map(x => x.ad + " " + x.yuzde + "%").join("\n"), km(a.trUzak), nm(a.trUzak), a.mvYuzde]));
  const kose = [["Alan", "Nokta"].concat(tek ? [KB_ADLARI[b]] : ["Enlem", "Boylam"], ["Enlem (ondalık)", "Boylam (ondalık)", "UTM", "MGRS"])];
  R.r.forEach(a => a.z.points.forEach(p => {
    const u = utmIleri(p.lat, p.lon);
    kose.push([a.z.name, /^\d+$/.test(p.no) ? +p.no : p.no].concat(tek ? [fk(p.lat, p.lon)] : fk(p.lat, p.lon, "|").split("|"),
      [ondalik(p.lat), ondalik(p.lon), u.zone + u.bant + " " + Math.round(u.E) + " " + Math.round(u.N), mgrsYaz(p.lat, p.lon, 5)]));
  }));
  const sayfalar = [
    {ad: "Alanlar", satirlar: ozet, genislik: [22, 7, 12, 11, 11, 13, 13, 34, 12, 40, 14, 14, 14]},
    {ad: "Köşeler", satirlar: kose, genislik: [22, 7].concat(tek ? [24] : [16, 16], [15, 15, 22, 22])}
  ];
  if (R.r.length > 1) sayfalar.push({ad: "Mesafeler (km)", satirlar: [[""].concat(R.r.map(a => a.z.name))].concat(R.r.map((a, i) => [a.z.name].concat(R.mesafe[i].map((m, j) => i === j ? "" : km(m))))),
    genislik: [22].concat(R.r.map(() => 14))});
  const ad = dosyaKoku() + " alan raporu.xlsx";
  download(ad, xlsxYaz(sayfalar));
}

$("btn-rapor").onclick = raporOlustur;
$("rapor-excel").onclick = raporExcel;
[$("rapor-x"), $("rapor-kapat")].forEach(b => b.onclick = () => { $("rapor").hidden = true; });
$("rapor").addEventListener("mousedown", e => { if (e.target === $("rapor")) $("rapor").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("rapor").hidden){ e.stopPropagation(); $("rapor").hidden = true; } }, true);
