/* ============ kerteriz ve mesafeyle konum: "Ankara'dan 045°, 120 NM" ============ */

/* WGS84 üzerinde doğru jeodezik problem (Vincenty 1975): başlangıç + kerteriz (°, gerçek) + mesafe (m) → varış */
function vincentyIleri(lat1, lon1, az1, s){
  const a = 6378137, f = 1/298.257223563, b = a * (1 - f), r = Math.PI / 180;
  const al1 = az1 * r, sA1 = Math.sin(al1), cA1 = Math.cos(al1);
  const tU1 = (1 - f) * Math.tan(lat1 * r), cU1 = 1 / Math.sqrt(1 + tU1 * tU1), sU1 = tU1 * cU1;
  const sig1 = Math.atan2(tU1, cA1), sA = cU1 * sA1, c2A = 1 - sA * sA;
  const uSq = c2A * (a * a - b * b) / (b * b);
  const A = 1 + uSq/16384*(4096 + uSq*(-768 + uSq*(320 - 175*uSq)));
  const B = uSq/1024*(256 + uSq*(-128 + uSq*(74 - 47*uSq)));
  let sig = s / (b * A), sigP, c2M, sS, cS, it = 0;
  do {
    c2M = Math.cos(2 * sig1 + sig); sS = Math.sin(sig); cS = Math.cos(sig);
    const dS = B*sS*(c2M + B/4*(cS*(-1 + 2*c2M*c2M) - B/6*c2M*(-3 + 4*sS*sS)*(-3 + 4*c2M*c2M)));
    sigP = sig; sig = s / (b * A) + dS;
  } while (Math.abs(sig - sigP) > 1e-12 && ++it < 200);
  sS = Math.sin(sig); cS = Math.cos(sig); c2M = Math.cos(2 * sig1 + sig);
  const x = sU1 * sS - cU1 * cS * cA1;
  const lat2 = Math.atan2(sU1 * cS + cU1 * sS * cA1, (1 - f) * Math.sqrt(sA * sA + x * x));
  const lam = Math.atan2(sS * sA1, cU1 * cS - sU1 * sS * cA1);
  const C = f/16 * c2A * (4 + f * (4 - 3 * c2A));
  const L = lam - (1 - C) * f * sA * (sig + C * sS * (c2M + C * cS * (-1 + 2 * c2M * c2M)));
  let lon2 = lon1 + L / r;
  lon2 = ((lon2 + 540) % 360) - 180;
  return {lat: lat2 / r, lon: lon2, az2: (Math.atan2(sA, -x) / r + 360) % 360};
}

/* ---- başlangıç: koordinat ya da haritadaki bir adın konumu ---- */
const trKucuk = s => String(s || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
function bilinenYerler(){
  const l = [];
  POINTS.forEach(p => l.push({ad: p.name, lat: p.lat, lon: p.lon, tur: "nokta"}));
  const gor = new Set();
  CIRCLES.forEach(c => { const k = c.name + "|" + c.lat + "|" + c.lon; if (!gor.has(k)){ gor.add(k); l.push({ad: c.name, lat: c.lat, lon: c.lon, tur: "daire merkezi"}); } });
  ZONES.forEach(z => z.points.forEach(p => l.push({ad: z.name + " " + p.no, lat: p.lat, lon: p.lon, tur: "alan köşesi"})));
  MEASURE.forEach(ch => ch.pts.forEach(p => { if (p.name) l.push({ad: p.name, lat: p.lat, lon: p.lon, tur: "ölçüm noktası"}); }));
  return l;
}
function baslangicBul(metin){
  const t = metin.trim();
  if (!t) return null;
  const k = koordBul(t);
  if (k && !k.hata) return {lat: k.lat, lon: k.lon, ad: null};
  const a = trKucuk(t).replace(/['’](dan|den|tan|ten)$/, "");
  const yer = bilinenYerler().find(y => trKucuk(y.ad) === a);
  return yer ? {lat: yer.lat, lon: yer.lon, ad: yer.ad} : null;
}

/* ---- satır: "045 120", "045°/120NM", "270, 35 km  Batı noktası" ---- */
const KM_SATIR = /^\s*(\d{1,3}(?:[.,]\d+)?)\s*°?\s*(?:T|G)?\s*(?:[\/;,]|\s)\s*(\d+(?:[.,]\d+)?)\s*(nm|km|m|deniz mili|dm)?\b\s*(.*)$/i;
function kmSatirlari(metin, birim){
  const out = [], hatalar = [];
  metin.split(/\r?\n/).forEach((l, i) => {
    if (!l.trim()) return;
    const m = l.match(KM_SATIR);
    if (!m){ hatalar.push((i + 1) + ". satır okunamadı: " + l.trim()); return; }
    const az = +m[1].replace(",", "."), v = +m[2].replace(",", ".");
    let u = (m[3] || birim).toLowerCase();
    if (u === "deniz mili" || u === "dm") u = "nm";
    if (az > 360){ hatalar.push((i + 1) + ". satır: kerteriz 0–360° olmalı"); return; }
    out.push({az: az % 360, v, u, d: v * UNIT_M[u], ad: m[4].trim() || null});
  });
  return {satirlar: out, hatalar};
}

/* ---- hesap ---- */
let KM_SON = null;
function kmHesapla(){
  const msg = $("km-msg");
  const bas = baslangicBul($("km-bas").value);
  const {satirlar, hatalar} = kmSatirlari($("km-satir").value, $("km-birim").value);
  const zincir = $("km-zincir").checked, onek = $("km-ad").value.trim() || "Hedef";
  KM_SON = null;
  const host = $("km-onizleme");
  host.innerHTML = "";
  $("km-ekle").disabled = true;
  if (!$("km-bas").value.trim()){ msg.textContent = ""; return; }
  if (!bas){ msg.innerHTML = '<span class="warn">Başlangıç okunamadı: bir koordinat ya da haritadaki bir nokta, köşe veya merkez adı yazın.</span>'; return; }
  let cur = bas;
  const sonuc = satirlar.map((s, i) => {
    const from = zincir ? cur : bas;
    const p = vincentyIleri(from.lat, from.lon, s.az, s.d);
    const r = {ad: s.ad || onek + " " + (i + 1), lat: p.lat, lon: p.lon, az: s.az, v: s.v, u: s.u, from};
    cur = r;
    return r;
  });
  KM_SON = {bas, sonuc};
  const satir = (ad, ayr) => { const d = document.createElement("div"); d.className = "km-row"; d.innerHTML = "<b>" + esc(ad) + "</b><small>" + esc(ayr) + "</small>"; host.appendChild(d); };
  satir(bas.ad || "Başlangıç", fk(bas.lat, bas.lon));
  sonuc.forEach(r => satir(r.ad, fk(r.lat, r.lon) + "   ←  " + String(r.az).padStart(3, "0") + "°, " + yaricapEtiketi(r.v, r.u)));
  msg.innerHTML = hatalar.length ? '<span class="warn">' + hatalar.slice(0, 4).map(esc).join("<br>") + "</span>" : "";
  $("km-ekle").disabled = !sonuc.length;
}

function kmEkle(){
  const r = KM_SON; if (!r || !r.sonuc.length) return;
  const hedef = $("km-hedef").value, basEkle = $("km-basdahil").checked;
  const ekle = (id, metin, ayir) => { const t = $(id); t.value = t.value.replace(/\s+$/, "") + (t.value.trim() ? (ayir ? "\n\n" : "\n") : "") + metin; t.dispatchEvent(new Event("input", {bubbles: true})); };
  const basAd = r.bas.ad || "Başlangıç";
  const liste = (basEkle ? [{ad: basAd, lat: r.bas.lat, lon: r.bas.lon}] : []).concat(r.sonuc);
  SUPPRESS_FIT = true;
  try {
    if (hedef === "alan"){
      const ad = $("km-ad").value.trim() || "Kerteriz alanı";
      ekle("input", liste.map((p, i) => (i ? "" : ad) + "\t" + (i + 1) + "\t" + fk(p.lat, p.lon, "\t", null, true)).join("\n"), true);
      build(); sekmeAc("pane-areas");
    } else if (hedef === "daire"){
      ekle("c-center", liste.map(p => p.ad + "\t" + fk(p.lat, p.lon, "\t", null, true)).join("\n"));
      buildCircles(); sekmeAc("pane-circles");
    } else if (hedef === "olcum"){
      newChain();
      const ch = MEASURE[MEASURE.length - 1];
      if (zincirMi()){
        [{ad: basAd, lat: r.bas.lat, lon: r.bas.lon}].concat(r.sonuc).forEach(p => ch.pts.push({lat: p.lat, lon: p.lon, name: p.ad}));
      } else {
        // yıldız: her hedef için başlangıçtan ayrı bir hat
        r.sonuc.forEach((p, i) => {
          if (i) newChain();
          const c = MEASURE[MEASURE.length - 1];
          c.pts.push({lat: r.bas.lat, lon: r.bas.lon, name: basAd}, {lat: p.lat, lon: p.lon, name: p.ad});
        });
      }
      hideEmpty(); measureList(); degisti(); sekmeAc("pane-measure");
    } else {
      ekle("p-input", liste.map(p => p.ad + "\t" + fk(p.lat, p.lon, "\t", null, true)).join("\n"));
      buildPoints(); sekmeAc("pane-points");
    }
  } finally { SUPPRESS_FIT = false; }
  $("km").hidden = true;
  const bb = liste.reduce((b, p) => [Math.min(b[0], p.lat), Math.min(b[1], p.lon), Math.max(b[2], p.lat), Math.max(b[3], p.lon)], [90, 180, -90, -180]);
  focusOn(bb[0], bb[1], bb[2], bb[3]);
  toast(r.sonuc.length + " konum eklendi");
}
const zincirMi = () => $("km-zincir").checked;

function kmAc(hedef){
  $("km-hedef").value = hedef || "nokta";
  const dl = $("km-yerler");
  dl.innerHTML = "";
  bilinenYerler().slice(0, 400).forEach(y => { const o = document.createElement("option"); o.value = y.ad; o.label = y.tur; dl.appendChild(o); });
  $("km").hidden = false;
  $("km-bas").focus();
  kmHesapla();
}
document.querySelectorAll("button.kerteriz").forEach(b => b.onclick = () => kmAc(b.dataset.hedef));
["km-bas", "km-satir", "km-ad"].forEach(id => $(id).addEventListener("input", kmHesapla));
["km-birim", "km-zincir"].forEach(id => $(id).addEventListener("change", kmHesapla));
$("km-ekle").onclick = kmEkle;
[$("km-x"), $("km-iptal")].forEach(b => b.onclick = () => { $("km").hidden = true; });
$("km").addEventListener("mousedown", e => { if (e.target === $("km")) $("km").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("km").hidden){ e.stopPropagation(); $("km").hidden = true; } }, true);
