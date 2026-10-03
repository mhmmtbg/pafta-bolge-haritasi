/* ============ haritada sürükleyerek düzenleme, geri al / yinele ============ */

/* ---- tutamaçlar: alan köşeleri, noktalar, daire merkezleri, ölçüm noktaları ---- */
var TUTAMAC = null;          // imlecin üstündeki tutamaç
var SURUK = null;            // {t: tutamaç, x0, y0, basladi, eski: {lat, lon}}
function duzenleAcik(){ return $("opt-duzenle").checked && !PICK; }

function tutamacBul(x, y){
  let en = null, bd = 9;
  const dene = (lat, lon, t) => { const d = Math.hypot(sx(lon) - x, sy(lat) - y); if (d < bd){ bd = d; en = Object.assign(t, {lat, lon}); } };
  if (opt("opt-layer-areas")) ZONES.forEach(z => { if (z.visible) z.points.forEach((p, i) => dene(p.lat, p.lon, {tur: "alan", z, p, ad: z.name + " / " + p.no})); });
  if (opt("opt-layer-circles")){ const g = new Set(); CIRCLES.forEach(c => { if (!g.has(c.li)){ g.add(c.li); dene(c.lat, c.lon, {tur: "daire", c, ad: c.name + " (merkez)"}); } }); }
  if (opt("opt-layer-points")) POINTS.forEach(p => dene(p.lat, p.lon, {tur: "nokta", p, ad: p.name}));
  if (opt("opt-layer-measure")) MEASURE.forEach((ch, ci) => ch.pts.forEach((p, i) => dene(p.lat, p.lon, {tur: "olcum", p, ad: p.name || "Hat " + (ci + 1) + " / " + (i + 1)})));
  if (typeof notTutamaclari === "function") notTutamaclari(dene);
  return en;
}

/* konumu nesneye uygula (sürüklerken her harekette) */
function tasi(t, lat, lon){
  if (t.tur === "alan" || t.tur === "nokta" || t.tur === "olcum"){ t.p.lat = lat; t.p.lon = lon; }
  else if (t.tur === "daire") CIRCLES.forEach(c => { if (c.li === t.c.li){ c.lat = lat; c.lon = lon; c.ring = geodesicRing(lat, lon, c.d, 240); } });
  else if (t.tasi) t.tasi(lat, lon);
}

/* listedeki satırda yalnız koordinat kısmını yeni değerle değiştir; satır değişmişse false */
function satirYaz(taId, li, cs, ce, lat, lon, kirp){
  const ta = $(taId), satirlar = ta.value.split("\n"), satir = satirlar[li];
  if (satir == null || cs == null) return null;
  const sonKirp = (str, s, e) => { while (e > s && /\s/.test(str[e - 1])) e--; return e; };
  const bak = kirp ? kirp(satir) : satir, ceN = sonKirp(bak, cs, ce);
  const uyar_ = (k, kay) => k && !k.hata && k.start + kay === cs && sonKirp(bak, k.start + kay, k.end + kay) === ceN;
  const lead = bak.length - bak.trimStart().length;
  if (!uyar_(koordBul(bak), 0) && !uyar_(koordBul(bak.trim()), lead)) return null;
  const eski = satir.slice(cs, ceN), sep = eski.includes("\t") ? "\t" : "  ";
  const yeni = fk(lat, lon, sep, null, true);
  satirlar[li] = satir.slice(0, cs) + yeni + satir.slice(ceN);
  ta.value = satirlar.join("\n");
  return cs + yeni.length;
}
const renkKirp = s => s.replace(/#[0-9a-fA-F]{6}\b/, m => " ".repeat(m.length));
const yaricapKirp = s => { const m = s.match(YARICAP_RE); return m && koordBul(s.slice(0, m.index)) ? s.slice(0, m.index) : s; };

function surukBitir(){
  const s = SURUK; SURUK = null;
  cv.classList.remove("tasiniyor");
  if (!s || !s.basladi) return;
  const t = s.t, lat = t.lat, lon = t.lon;
  let ce = true;
  if (t.tur === "alan"){ ce = satirYaz("input", t.p.li, t.p.cs, t.p.ce, lat, lon); if (ce) t.p.ce = ce; renderZoneList(); }
  else if (t.tur === "nokta"){ ce = satirYaz("p-input", t.p.li, t.p.cs, t.p.ce, lat, lon, renkKirp); if (ce) t.p.ce = ce; pointList(); }
  else if (t.tur === "daire"){ ce = satirYaz("c-center", t.c.li, t.c.cs, t.c.ce, lat, lon, yaricapKirp); if (ce) CIRCLES.forEach(c => { if (c.li === t.c.li) c.ce = ce; }); circleList(); }
  else if (t.tur === "olcum") measureList();
  else if (t.bitir) t.bitir();
  if (!ce){                                                       // liste elle değiştirilmiş: geri al
    tasi(t, s.eski.lat, s.eski.lon); draw();
    uyar("Konum listeye yazılamadı.", "Koordinat listesi çizimden sonra elle değiştirilmiş. Önce listeyi yeniden çizin (\"Bölgeleri çiz\" vb.), sonra sürükleyin.");
    return;
  }
  degisti();
  toast(t.ad + " → " + fk(lat, lon));
}

cv.addEventListener("mousedown", e => {
  if (e.button !== 0 || !duzenleAcik()) return;
  const t = tutamacBul(e.offsetX, e.offsetY);
  if (!t) return;
  dragging = false;                                               // harita kaymasın
  SURUK = {t, x0: e.offsetX, y0: e.offsetY, basladi: false, eski: {lat: t.lat, lon: t.lon}};
});
cv.addEventListener("mousemove", e => {
  if (SURUK){
    if (!SURUK.basladi && Math.hypot(e.offsetX - SURUK.x0, e.offsetY - SURUK.y0) > 3){ SURUK.basladi = true; moved = true; cv.classList.add("tasiniyor"); }
    if (SURUK.basladi){
      const lat = clamp(latAt(e.offsetY), -85, 85), lon = lonAt(e.offsetX);
      SURUK.t.lat = lat; SURUK.t.lon = lon;
      tasi(SURUK.t, lat, lon);
      if (MEASURE_ACTIVE || PICK) HOVER = null;
      scheduleDraw();
    }
    return;
  }
  if (dragging || !duzenleAcik()){ if (TUTAMAC){ TUTAMAC = null; cv.classList.remove("tasinabilir"); scheduleDraw(); } return; }
  const t = tutamacBul(e.offsetX, e.offsetY);
  const once = TUTAMAC;
  TUTAMAC = t;
  cv.classList.toggle("tasinabilir", !!t);
  if ((once && once.lat) !== (t && t.lat) || (once && once.lon) !== (t && t.lon)) scheduleDraw();
});
window.addEventListener("mouseup", surukBitir);
cv.addEventListener("mouseleave", () => { if (TUTAMAC && !SURUK){ TUTAMAC = null; cv.classList.remove("tasinabilir"); scheduleDraw(); } });

function drawDuzenle(){
  const t = SURUK && SURUK.basladi ? SURUK.t : TUTAMAC;
  if (!t) return;
  const X = sx(t.lon), Y = sy(t.lat);
  ctx.save();
  ctx.lineWidth = 2; ctx.strokeStyle = "#f2a93b"; ctx.fillStyle = "rgba(242,169,59,.18)";
  ctx.beginPath(); ctx.arc(X, Y, 9, 0, 6.284); ctx.fill(); ctx.stroke();
  if (SURUK && SURUK.basladi){
    const m = fk(t.lat, t.lon);
    ctx.font = "600 12px " + FONT();
    const w = ctx.measureText(m).width + 14;
    let bx = X + 16, by = Y + 12;
    if (bx + w > W - 16) bx = X - 16 - w;
    if (by + 22 > H - 16) by = Y - 34;
    ctx.fillStyle = "rgba(14,26,33,.9)"; ctx.fillRect(bx, by, w, 22);
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(m, bx + 7, by + 11.5);
  }
  ctx.restore();
}

/* ---- geri al / yinele: proje anlık görüntüleri (görünüm hariç) ---- */
const GECMIS = {yigin: [], i: -1, t: 0, uyguluyor: false};
function gecmisAnlik(){ const o = projeTopla(); delete o.gorunum; delete o.kayit; return JSON.stringify(o); }
function gecmisKaydet(){
  clearTimeout(GECMIS.t); GECMIS.t = 0;
  if (GECMIS.uyguluyor || YUKLENIYOR) return;
  const s = gecmisAnlik();
  if (GECMIS.yigin[GECMIS.i] === s) return;
  GECMIS.yigin.length = GECMIS.i + 1;
  GECMIS.yigin.push(s);
  if (GECMIS.yigin.length > 60) GECMIS.yigin.shift();
  GECMIS.i = GECMIS.yigin.length - 1;
  gecmisDugmeler();
}
function gecmisPlanla(){ if (GECMIS.uyguluyor || YUKLENIYOR) return; clearTimeout(GECMIS.t); GECMIS.t = setTimeout(gecmisKaydet, 450); }
function gecmisSifirla(){ GECMIS.yigin = []; GECMIS.i = -1; gecmisKaydet(); }
function gecmisGit(d){
  if (GECMIS.t) gecmisKaydet();                                  // bekleyen değişiklik önce kaydolsun
  const j = GECMIS.i + d;
  if (j < 0 || j >= GECMIS.yigin.length) return;
  GECMIS.i = j; GECMIS.uyguluyor = true;
  const b = viewBounds(), mode = view.mode, o = JSON.parse(GECMIS.yigin[j]);
  o.gorunum = {projeksiyon: mode, latMin: b.latMin, lonMin: b.lonMin, latMax: b.latMax, lonMax: b.lonMax};
  try {
    const ac = (document.querySelector(".pane.active") || {}).id;
    projeYukleAsil(o);
    if (ac) sekmeAc(ac);
    setKirli(true);
  } finally { GECMIS.uyguluyor = false; }
  gecmisDugmeler();
  toast(d < 0 ? "Geri alındı" : "Yinelendi");
}
function gecmisDugmeler(){
  $("btn-geri").disabled = GECMIS.i <= 0;
  $("btn-ileri").disabled = GECMIS.i >= GECMIS.yigin.length - 1;
}

/* değişiklik bildirimi, proje yükleme ve yeni pafta: geçmişle bağla */
const degistiAsil = degisti;
degisti = function(){ degistiAsil(); gecmisPlanla(); };
const projeYukleAsil = projeYukle;
projeYukle = function(o){ projeYukleAsil(o); if (!GECMIS.uyguluyor) setTimeout(gecmisSifirla, 0); };
const yeniAsil = yeni;
yeni = async function(){ await yeniAsil(); gecmisSifirla(); };
PANEL.addEventListener("input", gecmisPlanla);
PANEL.addEventListener("change", gecmisPlanla);
PANEL.addEventListener("click", e => { if (e.target.closest("button")) gecmisPlanla(); });

$("btn-geri").onclick = () => gecmisGit(-1);
$("btn-ileri").onclick = () => gecmisGit(1);
document.addEventListener("keydown", e => {
  const k = (e.key || "").toLowerCase();
  if (!(e.ctrlKey || e.metaKey) || e.altKey || (k !== "z" && k !== "y")) return;
  const a = document.activeElement;
  if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "checkbox" && a.type !== "range" && a.type !== "color" || a.isContentEditable)) return;   // metin kutusunda kendi geri alması
  if (document.querySelector(".modal:not([hidden])")) return;
  e.preventDefault(); e.stopPropagation();
  gecmisGit(k === "y" || e.shiftKey ? 1 : -1);
}, true);
setTimeout(gecmisSifirla, 0);
