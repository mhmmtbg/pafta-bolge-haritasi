/* ============ koordinat motoru: UTM, MGRS, biçimler, ortak koordinat bulucu ============ */

/* ---- UTM (WGS84, Krüger serisi; bölge içinde mm doğruluğu) ---- */
const UTM_K = (() => {
  const a = 6378137, f = 1 / 298.257223563, n = f / (2 - f), n2 = n * n, n3 = n2 * n;
  return {
    A: a / (1 + n) * (1 + n2 / 4 + n2 * n2 / 64), k0: 0.9996, n,
    al: [n / 2 - 2 * n2 / 3 + 5 * n3 / 16, 13 * n2 / 48 - 3 * n3 / 5, 61 * n3 / 240],
    be: [n / 2 - 2 * n2 / 3 + 37 * n3 / 96, n2 / 48 + n3 / 15, 17 * n3 / 480],
    de: [2 * n - 2 * n2 / 3 - 2 * n3, 7 * n2 / 3 - 8 * n3 / 5, 56 * n3 / 15]
  };
})();
const BANTLAR = "CDEFGHJKLMNPQRSTUVWX";

function utmDilim(lat, lon){
  let z = Math.floor((lon + 180) / 6) + 1;
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) z = 32;                      // Norveç
  if (lat >= 72 && lat < 84){ if (lon >= 0 && lon < 9) z = 31; else if (lon >= 9 && lon < 21) z = 33; else if (lon >= 21 && lon < 33) z = 35; else if (lon >= 33 && lon < 42) z = 37; }
  return Math.min(60, Math.max(1, z));
}
const utmBant = lat => BANTLAR[Math.min(19, Math.max(0, Math.floor((lat + 80) / 8)))];

function utmIleri(lat, lon, zone){
  const K = UTM_K, z = zone || utmDilim(lat, lon), l0 = rad(z * 6 - 183);
  const p = rad(lat), dl = rad(lon) - l0, c = 2 * Math.sqrt(K.n) / (1 + K.n);
  const t = Math.sinh(Math.atanh(Math.sin(p)) - c * Math.atanh(c * Math.sin(p)));
  const xi = Math.atan(t / Math.cos(dl)), eta = Math.atanh(Math.sin(dl) / Math.sqrt(1 + t * t));
  let E = eta, N = xi;
  for (let j = 1; j <= 3; j++){
    E += K.al[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
    N += K.al[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
  }
  return {zone: z, bant: utmBant(lat), guney: lat < 0, E: 500000 + K.k0 * K.A * E, N: (lat < 0 ? 1e7 : 0) + K.k0 * K.A * N};
}

function utmGeri(zone, guney, E, N){
  const K = UTM_K, xi = (N - (guney ? 1e7 : 0)) / (K.k0 * K.A), eta = (E - 500000) / (K.k0 * K.A);
  let xp = xi, ep = eta;
  for (let j = 1; j <= 3; j++){
    xp -= K.be[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
    ep -= K.be[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
  }
  const chi = Math.asin(Math.sin(xp) / Math.cosh(ep));
  let p = chi;
  for (let j = 1; j <= 3; j++) p += K.de[j - 1] * Math.sin(2 * j * chi);
  return {lat: p * 180 / Math.PI, lon: zone * 6 - 183 + Math.atan(Math.sinh(ep) / Math.cos(xp)) * 180 / Math.PI};
}

/* ---- MGRS (WGS84, AA şeması) ---- */
const MGRS_SUTUN = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"], MGRS_SATIR = "ABCDEFGHJKLMNPQRSTUV";

function mgrsYaz(lat, lon, basamak){
  basamak = basamak || 5;
  const u = utmIleri(lat, lon);
  const sutun = MGRS_SUTUN[(u.zone - 1) % 3][Math.floor(u.E / 1e5) - 1];
  const satir = MGRS_SATIR[(Math.floor(u.N / 1e5) + (u.zone % 2 === 0 ? 5 : 0)) % 20];
  const b = 10 ** (5 - basamak);
  const e = String(Math.floor((u.E % 1e5) / b)).padStart(basamak, "0"), nn = String(Math.floor((u.N % 1e5) / b)).padStart(basamak, "0");
  return u.zone + u.bant + " " + sutun + satir + " " + e + " " + nn;
}

function mgrsOku(zone, bant, sutun, satir, e, n){
  bant = bant.toUpperCase(); sutun = sutun.toUpperCase(); satir = satir.toUpperCase();
  const si = MGRS_SUTUN[(zone - 1) % 3].indexOf(sutun), ri = MGRS_SATIR.indexOf(satir), bi = BANTLAR.indexOf(bant);
  if (si < 0 || ri < 0 || bi < 0 || e.length !== n.length) return null;
  const olcek = 10 ** (5 - e.length);
  const E = (si + 1) * 1e5 + (+e + .5) * olcek;
  let N = ((ri - (zone % 2 === 0 ? 5 : 0) + 20) % 20) * 1e5 + (+n + .5) * olcek;
  const guney = bi < 10, enlemAlt = -80 + bi * 8;
  const altN = utmIleri(enlemAlt, zone * 6 - 183, zone).N;
  while (N < altN - 1e5) N += 2e6;                                               // bandın altına düşmesin
  return utmGeri(zone, guney, E, N);
}

/* ---- gösterim biçimleri ---- */
const KB_ADLARI = {dms: "Derece-dakika-saniye", dm: "Derece, ondalık dakika", dd: "Ondalık derece", utm: "UTM", mgrs: "MGRS"};
function kBicim(){ const e = document.getElementById("opt-kbicim"); return e ? e.value : "dms"; }

function dm(v, isLat, b){
  b = b || 2;
  const neg = v < 0; let a = Math.abs(v), d = Math.floor(a), m = (a - d) * 60;
  if (+m.toFixed(b) >= 60){ d++; m = 0; }
  return d + "°" + m.toFixed(b).padStart(3 + b, "0").replace(".", ",") + "'" + (isLat ? (neg ? "G" : "K") : (neg ? "B" : "D"));
}
function dd(v, isLat, b){
  return Math.abs(v).toFixed(b || 5) + "°" + (isLat ? (v < 0 ? "G" : "K") : (v < 0 ? "B" : "D"));
}
/* seçili biçimde tek metin; sep: enlem ile boylam arası (listelerde sekme);
   hassas: hesaplanan konumları listeye yazarken (saniyenin onda biri, ~3 m) */
function fk(lat, lon, sep, bicim, hassas){
  sep = sep == null ? "  " : sep;
  switch (bicim || kBicim()){
    case "dm":   return dm(lat, true, hassas ? 4 : 2) + sep + dm(lon, false, hassas ? 4 : 2);
    case "dd":   return dd(lat, true, hassas ? 6 : 5) + sep + dd(lon, false, hassas ? 6 : 5);
    case "utm":  { const u = utmIleri(lat, lon); return u.zone + u.bant + " " + Math.round(u.E) + " " + Math.round(u.N); }
    case "mgrs": return mgrsYaz(lat, lon, 5);
    default:     return dms(lat, true, hassas ? 1 : 0) + sep + dms(lon, false, hassas ? 1 : 0);
  }
}

/* ---- ortak koordinat bulucu: bir satırdaki ilk koordinat çifti ----
   Dönüş: {lat, lon, start, end} | null (koordinat yok) | {hata} (sınır dışı) */
const MGRS_RE = /\b(\d{1,2})\s?([C-HJ-NP-X])\s?([A-HJ-NP-Z])([A-HJ-NP-V])\s?(\d{1,5})\s?(\d{1,5})\b/i;
const UTM_RE = /\b(\d{1,2})\s?([C-HJ-NP-X])\s+(\d{6}(?:[.,]\d+)?)\s*(?:m\s*)?E?\s+(\d{7}(?:[.,]\d+)?)\s*(?:m\s*)?N?\b/i;
function koordBul(line){
  let m = line.match(MGRS_RE);
  if (m && m[5].length === m[6].length){
    const r = mgrsOku(+m[1], m[2], m[3], m[4], m[5], m[6]);
    if (r) return {lat: r.lat, lon: r.lon, start: m.index, end: m.index + m[0].length};
  }
  m = line.match(UTM_RE);
  if (m){
    const z = +m[1], bant = m[2].toUpperCase(), E = +m[3].replace(",", "."), N = +m[4].replace(",", ".");
    if (z >= 1 && z <= 60 && BANTLAR.includes(bant)){
      const r = utmGeri(z, BANTLAR.indexOf(bant) < 10, E, N);
      return {lat: r.lat, lon: r.lon, start: m.index, end: m.index + m[0].length};
    }
  }
  const hits = scanCoords(line);
  if (hits.length < 2) return null;
  const p = coordPair(hits);
  if (!p) return {hata: true};
  return {lat: p.lat, lon: p.lon, start: p.start, end: hits[hits.length - 1].end};
}

/* imleç göstergesi: seçili biçimde koordinat; Türkiye içindeyse il / ilçe */
function gostergeYaz(la, lo){
  const b = kBicim(), yer = typeof ilIlceBul === "function" ? ilIlceBul(la, lo) : null;
  let h;
  if (b === "utm" || b === "mgrs") h = "<b>" + KB_ADLARI[b] + "</b><span>" + esc(fk(la, lo)) + "</span>";
  else { const t = fk(la, lo, "|").split("|"); h = "<b>Enlem</b><span>" + esc(t[0]) + "</span><b>Boylam</b><span>" + esc(t[1]) + "</span>"; }
  if (yer) h += "<b>" + esc(yer.il) + "</b><span>" + esc(yer.ilce) + "</span>";
  $("readout").innerHTML = h;
}
document.getElementById("opt-kbicim").addEventListener("change", () => {
  pointList(); measureList(); draw();
});
