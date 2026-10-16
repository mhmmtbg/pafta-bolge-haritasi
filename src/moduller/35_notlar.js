/* ============ notlar, oklar ve çizgiler ============ */
/* Notlar sekmesi açıkken haritaya tıklamak not koyar; Ok kipinde iki tıklama bir ok çizer;
   Çizgi kipinde her tıklama bir köşe ekler. Hepsi projeye kaydedilir, sürüklenerek taşınır. */
var NOTLAR = [];             // {tur:"not", lat, lon, metin, renk, boyut} | {tur:"ok", a:{lat,lon}, b:{lat,lon}, metin, renk}
                             // | {tur:"cizgi", pts:[{lat,lon}], metin, renk, boyut, tip:"duz"|"kesikli"|"noktali", kalinlik,
                             //    egri: noktalardan geçen yumuşak eğri, kaynak: "liste" ise koordinat listesinden üretilmiştir}
var NOT_AKTIF = false, NOT_OK_BAS = null, NOT_IMLEC = null;
var NOT_CIZGI = [];          // çizilmekte olan çizginin köşeleri
const NOT_RENKLER = ["#16222a", "#a4123f", "#00798c", "#e08e0b", "#3c6e2a", "#6a3d9a"];
function notKip(){ return document.querySelector('input[name="n-kip"]:checked').value; }

function notEkle(n){ NOTLAR.push(n); hideEmpty(); notListe(); draw(); degisti(); }

/* ---- çizgi kipi ---- */
function cizgiDugmeleri(){
  const ck = notKip() === "cizgi";
  $("n-cizgi-ayar").hidden = !ck;
  $("n-liste-kutu").hidden = !ck;
  $("btn-n-bitir").hidden = !ck;
  $("btn-n-bitir").disabled = NOT_CIZGI.length < 2;
}
function cizgiBitir(){
  const pts = NOT_CIZGI;
  NOT_CIZGI = [];
  if (pts.length >= 2)
    notEkle({tur: "cizgi", pts, metin: "", renk: $("n-renk").value, boyut: +$("n-boyut").value,
             tip: $("n-tip").value, kalinlik: +$("n-kalinlik").value, egri: $("n-egri").checked});
  else draw();
  cizgiDugmeleri();
}
function cizgiTireleri(tip, w){
  if (tip === "kesikli") return [w * 4 + 4, w * 2.5 + 3];
  if (tip === "noktali") return [.1, w * 2 + 3];                 // yuvarlak uçla noktalar
  return [];
}
/* eğri: Catmull-Rom'dan kübik Bezier; eğri verilen bütün noktalardan geçer. Kapalı çizgide (ilk = son) dolanır. */
function egriKontrol(xy){
  const n = xy.length, kapali = n > 3 && Math.hypot(xy[0][0] - xy[n-1][0], xy[0][1] - xy[n-1][1]) < 1e-9;
  const al = i => kapali ? xy[((i % (n - 1)) + (n - 1)) % (n - 1)] : xy[Math.max(0, Math.min(n - 1, i))];
  const out = [];
  for (let i = 0; i < n - 1; i++){
    const p0 = al(i - 1), p1 = xy[i], p2 = xy[i + 1], p3 = al(i + 2);
    out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return out;
}
/* eğriyi kırık çizgiyle örnekle (orta nokta, uzunluk, vurgu için) */
function egriOrnek(xy, adim){
  if (xy.length < 3) return xy;
  const out = [xy[0]];
  egriKontrol(xy).forEach(([a, b, c, d]) => {
    for (let k = 1; k <= adim; k++){
      const t = k / adim, u = 1 - t;
      out.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]);
    }
  });
  return out;
}
function cizgiYolu(pts, egri){
  ctx.beginPath();
  const xy = pts.map(p => [sx(p.lon), sy(p.lat)]);
  if (egri && xy.length >= 3){
    ctx.moveTo(xy[0][0], xy[0][1]);
    egriKontrol(xy).forEach(([, b, c, d]) => ctx.bezierCurveTo(b[0], b[1], c[0], c[1], d[0], d[1]));
    return;
  }
  xy.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
}
function cizgiOrtasi(pts, egri){                                   // ekran uzunluğuna göre orta nokta
  let xy = pts.map(p => [sx(p.lon), sy(p.lat)]);
  if (egri) xy = egriOrnek(xy, 12);
  let top = 0;
  for (let i = 1; i < xy.length; i++) top += Math.hypot(xy[i][0] - xy[i-1][0], xy[i][1] - xy[i-1][1]);
  let kalan = top / 2;
  for (let i = 1; i < xy.length; i++){
    const d = Math.hypot(xy[i][0] - xy[i-1][0], xy[i][1] - xy[i-1][1]);
    if (d >= kalan && d > 0){ const t = kalan / d; return [xy[i-1][0] + t * (xy[i][0] - xy[i-1][0]), xy[i-1][1] + t * (xy[i][1] - xy[i-1][1])]; }
    kalan -= d;
  }
  return xy[0];
}
function cizgiUzunluk(pts, egri){
  if (egri && pts.length >= 3)                                     // eğri boylam/enlem düzleminde örneklenir
    pts = egriOrnek(pts.map(p => [p.lon, p.lat]), 16).map(([lon, lat]) => ({lat, lon}));
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += vincenty(pts[i-1].lat, pts[i-1].lon, pts[i].lat, pts[i].lon).d;
  return d;
}

/* ---- çizim ---- */
function okUcu(x1, y1, x2, y2, boy){
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.moveTo(x2, y2); ctx.lineTo(x2 - boy * Math.cos(a - .42), y2 - boy * Math.sin(a - .42));
  ctx.moveTo(x2, y2); ctx.lineTo(x2 - boy * Math.cos(a + .42), y2 - boy * Math.sin(a + .42));
}
function notKutusu(metin, X, Y, renk, boyut, ortala){
  const fs = boyut || 13, satirlar = String(metin || "").split("\n").slice(0, 8);
  ctx.font = "600 " + fs + "px " + FONT();
  const w = Math.max(...satirlar.map(s => ctx.measureText(s).width)) + 14, h = satirlar.length * (fs + 4) + 8;
  const bx = ortala ? X - w / 2 : X + 8, by = ortala ? Y - h / 2 : Y - h - 8;
  ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.strokeStyle = renk; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = renk; ctx.textAlign = "left"; ctx.textBaseline = "top";
  satirlar.forEach((s, i) => ctx.fillText(s, bx + 7, by + 5 + i * (fs + 4)));
  LABELS.push([bx, by, bx + w, by + h]);
}
function drawNotlar(){
  if (!NOTLAR || (!NOTLAR.length && !NOT_OK_BAS && !(NOT_CIZGI && NOT_CIZGI.length))) return;     // var: modül kodundan önce de çağrılabilir
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  NOTLAR.forEach(n => {                                          // çizgiler önce: not kutuları üstte kalsın
    if (n.tur !== "cizgi") return;
    const w = n.kalinlik || 2.5;
    ctx.setLineDash([]); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = w + 2.6;
    if (n.tip !== "noktali"){ cizgiYolu(n.pts, n.egri); ctx.stroke(); }  // noktalıda beyaz hale noktaları siler
    ctx.setLineDash(cizgiTireleri(n.tip, w)); ctx.strokeStyle = n.renk; ctx.lineWidth = n.tip === "noktali" ? w * 1.4 : w;
    cizgiYolu(n.pts, n.egri); ctx.stroke();
    ctx.setLineDash([]);
    if (n.metin){ const m = cizgiOrtasi(n.pts, n.egri); notKutusu(n.metin, m[0], m[1], n.renk, n.boyut, false); }
  });
  NOTLAR.forEach(n => {
    if (n.tur === "cizgi") return;
    if (n.tur === "ok"){
      const x1 = sx(n.a.lon), y1 = sy(n.a.lat), x2 = sx(n.b.lon), y2 = sy(n.b.lat);
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); okUcu(x1, y1, x2, y2, 14); ctx.stroke();
      ctx.strokeStyle = n.renk; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); okUcu(x1, y1, x2, y2, 14); ctx.stroke();
      if (n.metin) notKutusu(n.metin, x1, y1, n.renk, n.boyut, false);
    } else {
      const X = sx(n.lon), Y = sy(n.lat);
      ctx.fillStyle = n.renk; ctx.beginPath(); ctx.arc(X, Y, 3.2, 0, 6.284); ctx.fill();
      ctx.strokeStyle = n.renk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + 8, Y - 8); ctx.stroke();
      notKutusu(n.metin || "Not", X, Y, n.renk, n.boyut, false);
    }
  });
  if (NOT_OK_BAS && NOT_IMLEC){                                   // ok önizlemesi
    const x1 = sx(NOT_OK_BAS.lon), y1 = sy(NOT_OK_BAS.lat), x2 = NOT_IMLEC.x, y2 = NOT_IMLEC.y;
    ctx.setLineDash([6, 5]); ctx.strokeStyle = $("n-renk").value; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); okUcu(x1, y1, x2, y2, 14); ctx.stroke();
  }
  if (NOT_CIZGI.length){                                          // çizgi önizlemesi
    const w = +$("n-kalinlik").value, renk = $("n-renk").value;
    ctx.strokeStyle = renk; ctx.lineWidth = w;
    ctx.setLineDash(cizgiTireleri($("n-tip").value, w));
    cizgiYolu(NOT_CIZGI, $("n-egri").checked); ctx.stroke();
    if (NOT_IMLEC){
      const s = NOT_CIZGI[NOT_CIZGI.length - 1];
      ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx(s.lon), sy(s.lat)); ctx.lineTo(NOT_IMLEC.x, NOT_IMLEC.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    NOT_CIZGI.forEach(p => {
      ctx.fillStyle = "#fff"; ctx.strokeStyle = renk; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(sx(p.lon), sy(p.lat), 3.6, 0, 6.284); ctx.fill(); ctx.stroke();
    });
  }
  ctx.restore();
}

/* ---- sürükleyerek düzenleme (40_duzenle.js tutamaçlarına katılır) ---- */
function notTutamaclari(dene){
  if (!opt("opt-layer-notes")) return;
  NOTLAR.forEach(n => {
    if (n.tur === "ok"){
      dene(n.a.lat, n.a.lon, {tur: "not", ad: "Ok başı", tasi: (la, lo) => { n.a = {lat: la, lon: lo}; }, bitir: notListe});
      dene(n.b.lat, n.b.lon, {tur: "not", ad: "Ok ucu", tasi: (la, lo) => { n.b = {lat: la, lon: lo}; }, bitir: notListe});
    } else if (n.tur === "cizgi"){
      n.pts.forEach((p, i) => dene(p.lat, p.lon, {tur: "not", ad: (n.metin || "Çizgi") + " köşesi " + (i + 1),
        tasi: (la, lo) => { p.lat = la; p.lon = lo; },
        bitir: () => {                                              // listeden gelen çizgide yeni koordinat satıra yazılır
          if (n.kaynak === "liste"){
            const ce = satirYaz("n-liste", p.li, p.cs, p.ce, p.lat, p.lon);
            if (ce) p.ce = ce; else toast("Koordinat listesi değişmiş; yeni konum listeye yazılamadı. \"Çizgileri çiz\" ile yenileyin.", true);
          }
          notListe();
        }}));
    } else dene(n.lat, n.lon, {tur: "not", ad: n.metin || "Not", tasi: (la, lo) => { n.lat = la; n.lon = lo; }, bitir: notListe});
  });
}

/* ---- liste ---- */
function notListe(){
  const host = $("n-list");
  host.innerHTML = "";
  $("n-msg").innerHTML = NOTLAR.length ? "" : '<span class="warn">Henüz not yok — haritaya tıklayın.</span>';
  NOTLAR.forEach((n, i) => {
    const row = document.createElement("div");
    row.className = "zone not-satir";
    const tek = n.tur === "ok" || n.tur === "cizgi";
    const inp = document.createElement(tek ? "input" : "textarea");
    inp.className = "not-metin"; inp.value = n.metin || ""; inp.spellcheck = false;
    inp.placeholder = n.tur === "ok" ? "Ok etiketi (isteğe bağlı)" : n.tur === "cizgi" ? "Çizgi etiketi (isteğe bağlı)" : "Not metni";
    if (!tek) inp.rows = Math.min(4, Math.max(1, (n.metin || "").split("\n").length));
    inp.oninput = () => { n.metin = inp.value; scheduleDraw(); };
    const meta = document.createElement("span");
    meta.className = "zone-meta";
    meta.textContent = n.tur === "cizgi"
      ? (n.egri ? "Eğri" : "Çizgi") + " · " + n.pts.length + " köşe · " + fmtDist(cizgiUzunluk(n.pts, n.egri)) + (n.kaynak === "liste" ? " · listeden" : "")
      : n.tur === "ok"
      ? "Ok · " + fmtDist(vincenty(n.a.lat, n.a.lon, n.b.lat, n.b.lon).d) + " · " + String(Math.round(vincenty(n.a.lat, n.a.lon, n.b.lat, n.b.lon).az)).padStart(3, "0") + "°"
      : "Not · " + fk(n.lat, n.lon);
    const kutu = document.createElement("span");
    kutu.className = "zone-name"; kutu.append(inp, meta);
    row.append(swatch(n.renk, v => n.renk = v), kutu);
    if (n.tur === "cizgi"){
      const eb = smallBtn("egri", () => { n.egri = !n.egri; notListe(); draw(); degisti(); });
      eb.setAttribute("aria-pressed", n.egri ? "true" : "false");
      row.append(eb);
    }
    row.append(
      smallBtn("odak", () => n.tur === "cizgi"
        ? focusOn(Math.min(...n.pts.map(p => p.lat)), Math.min(...n.pts.map(p => p.lon)), Math.max(...n.pts.map(p => p.lat)), Math.max(...n.pts.map(p => p.lon)))
        : n.tur === "ok" ? focusOn(n.a.lat, n.a.lon, n.b.lat, n.b.lon) : focusOn(n.lat, n.lon, n.lat, n.lon)),
      smallBtn("sil", () => { NOTLAR.splice(i, 1); notListe(); draw(); degisti(); }));
    vurguBagla(row, {tur: "not", n});
    host.appendChild(row);
  });
}

/* ---- koordinat listesinden çizgiler: her grup bir çizgi (Alanlar biçimi; boş satır yeni çizgi) ---- */
function cizgileriCiz(){
  const res = parseText($("n-liste").value);
  const eski = new Map();
  NOTLAR.forEach(n => { if (n.kaynak === "liste" && !eski.has(n.metin)) eski.set(n.metin, n); });
  const yeni = res.zones.filter(z => z.points.length >= 2).map(z => {
    const e = eski.get(z.name);
    return {tur: "cizgi", kaynak: "liste", metin: z.name,
            pts: z.points.map(p => ({lat: p.lat, lon: p.lon, li: p.li, cs: p.cs, ce: p.ce})),
            renk: e ? e.renk : $("n-renk").value, boyut: e ? e.boyut : +$("n-boyut").value,
            tip: e ? e.tip : $("n-tip").value, kalinlik: e ? e.kalinlik : +$("n-kalinlik").value,
            egri: e ? e.egri : $("n-egri").checked};
  });
  NOTLAR = NOTLAR.filter(n => n.kaynak !== "liste").concat(yeni);
  const tek = res.zones.filter(z => z.points.length < 2).length;
  $("n-liste-msg").innerHTML = yeni.length
    ? '<span class="ok">' + yeni.length + " çizgi, " + yeni.reduce((s, n) => s + n.pts.length, 0) + " köşe çizildi.</span>" +
      (tek ? ' <span class="warn">' + tek + " grup tek noktalı, atlandı.</span>" : "")
    : '<span class="warn">En az iki koordinatlık bir grup gerekli.</span>';
  if (res.errors.length) $("n-liste-msg").innerHTML += '<br><span class="warn">' + res.errors.slice(0, 6).map(esc).join("<br>") + "</span>";
  notListe();
  if (yeni.length){ hideEmpty(); fitAll(); } else draw();
  degisti();
}
/* proje açılınca: listeden gelen çizgilere satır konumlarını yeniden bağla (sürükleyince listeye yazılabilsin) */
function listeKonumlariBagla(){
  const z = parseText($("n-liste").value).zones.filter(z => z.points.length >= 2), L = NOTLAR.filter(n => n.kaynak === "liste");
  if (z.length !== L.length) return;
  L.forEach((n, i) => { if (z[i].points.length === n.pts.length) n.pts.forEach((p, k) => { p.li = z[i].points[k].li; p.cs = z[i].points[k].cs; p.ce = z[i].points[k].ce; }); });
}
$("btn-n-liste").onclick = cizgileriCiz;
$("btn-n-liste-temizle").onclick = () => { $("n-liste").value = ""; NOTLAR = NOTLAR.filter(n => n.kaynak !== "liste"); $("n-liste-msg").textContent = ""; notListe(); draw(); degisti(); };
XL_HEDEF.cizgi = {ta: "n-liste", ciz: () => cizgileriCiz(), pane: "pane-notes", ad: "Çizgiler"};

/* ---- haritaya tıklama ---- */
cv.addEventListener("click", e => {
  if (!NOT_AKTIF || moved || PICK) return;
  const sn = snapAt(e.offsetX, e.offsetY);
  const lat = sn ? sn.lat : latAt(e.offsetY), lon = sn ? sn.lon : lonAt(e.offsetX);
  if (Math.abs(lat) > 85) return;
  const renk = $("n-renk").value, boyut = +$("n-boyut").value;
  if (notKip() === "cizgi"){
    const son = NOT_CIZGI[NOT_CIZGI.length - 1];
    if (son && Math.hypot(sx(son.lon) - e.offsetX, sy(son.lat) - e.offsetY) < 7){ cizgiBitir(); return; }   // son köşeye yeniden tıklama / çift tıklama
    NOT_CIZGI.push({lat, lon}); cizgiDugmeleri(); draw();
    return;
  }
  if (notKip() === "ok"){
    if (!NOT_OK_BAS){ NOT_OK_BAS = {lat, lon}; draw(); return; }
    notEkle({tur: "ok", a: NOT_OK_BAS, b: {lat, lon}, metin: "", renk, boyut});
    NOT_OK_BAS = null;
    return;
  }
  notEkle({tur: "not", lat, lon, metin: "", renk, boyut});
  const t = $("n-list").lastElementChild.querySelector(".not-metin");
  if (t) t.focus();
});
cv.addEventListener("dblclick", e => { if (NOT_AKTIF && NOT_CIZGI.length){ e.preventDefault(); cizgiBitir(); } });
cv.addEventListener("mousemove", e => {
  if (NOT_AKTIF && (NOT_OK_BAS || NOT_CIZGI.length)){ NOT_IMLEC = {x: e.offsetX, y: e.offsetY}; scheduleDraw(); }
});
cv.addEventListener("mouseleave", () => { if (NOT_IMLEC){ NOT_IMLEC = null; scheduleDraw(); } });
document.addEventListener("keydown", e => {
  if (document.querySelector(".modal:not([hidden])")) return;
  if (e.key === "Escape" && NOT_OK_BAS){ NOT_OK_BAS = null; draw(); }
  if (!NOT_CIZGI.length) return;
  const a = document.activeElement;
  if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "radio" && a.type !== "checkbox" || a.isContentEditable)) return;
  if (e.key === "Escape"){ NOT_CIZGI = []; cizgiDugmeleri(); draw(); }
  else if (e.key === "Enter"){ e.preventDefault(); cizgiBitir(); }
  else if (e.key === "Backspace" || e.key === "Delete"){ e.preventDefault(); NOT_CIZGI.pop(); cizgiDugmeleri(); draw(); }
});
document.querySelectorAll(".tab[data-pane]").forEach(t => t.addEventListener("click", () => {
  if (NOT_CIZGI.length) cizgiBitir();                            // sekme değişince yarım çizgi kaydolur (2+ köşe)
  NOT_AKTIF = t.dataset.pane === "pane-notes";
  NOT_OK_BAS = null;
  if (NOT_AKTIF) cv.classList.add("measure");
  draw();
}));
document.querySelectorAll('input[name="n-kip"]').forEach(r => r.addEventListener("change", () => {
  NOT_OK_BAS = null;
  if (NOT_CIZGI.length) cizgiBitir();
  cizgiDugmeleri(); draw();
}));
$("btn-n-bitir").onclick = cizgiBitir;
["n-tip", "n-kalinlik", "n-renk"].forEach(id => $(id).addEventListener("input", () => { if (NOT_CIZGI.length) draw(); }));
$("btn-n-clear").onclick = () => { NOTLAR = []; NOT_OK_BAS = null; NOT_CIZGI = []; cizgiDugmeleri(); notListe(); draw(); degisti(); };
$("opt-layer-notes").addEventListener("change", draw);
$("n-renk").value = NOT_RENKLER[1];

/* ---- proje dosyası ---- */
const projeToplaNotsuz = projeTopla;
projeTopla = function(){
  const o = projeToplaNotsuz();
  const r6 = v => Math.round(v * 1e6) / 1e6, k = p => ({enlem: r6(p.lat), boylam: r6(p.lon)});
  o.notlar = NOTLAR.map(n => n.tur === "cizgi"
    ? Object.assign({tur: "cizgi", noktalar: n.pts.map(k), metin: n.metin || "", renk: n.renk, boyut: n.boyut, tip: n.tip, kalinlik: n.kalinlik},
                    n.egri ? {egri: true} : {}, n.kaynak ? {kaynak: n.kaynak} : {})
    : n.tur === "ok"
    ? {tur: "ok", bas: k(n.a), uc: k(n.b), metin: n.metin || "", renk: n.renk, boyut: n.boyut}
    : Object.assign({tur: "not", metin: n.metin || "", renk: n.renk, boyut: n.boyut}, k(n)));
  return o;
};
const katmanlariTemizleNotsuz = katmanlariTemizle;
katmanlariTemizle = function(){ katmanlariTemizleNotsuz(); NOTLAR = []; NOT_OK_BAS = null; NOT_CIZGI = []; cizgiDugmeleri(); notListe(); };
const projeYukleNotsuz = projeYukle;
projeYukle = function(o){
  projeYukleNotsuz(o);
  const n = p => p && isFinite(p.enlem) && isFinite(p.boylam);
  const TIPLER = ["duz", "kesikli", "noktali"];
  NOTLAR = (o.notlar || []).filter(x => x.tur === "cizgi" ? Array.isArray(x.noktalar) && x.noktalar.filter(n).length >= 2
                                       : x.tur === "ok" ? n(x.bas) && n(x.uc) : n(x)).map(x => x.tur === "cizgi"
    ? {tur: "cizgi", pts: x.noktalar.filter(n).map(p => ({lat: +p.enlem, lon: +p.boylam})), metin: x.metin || "", renk: x.renk || NOT_RENKLER[1],
       boyut: +x.boyut || 13, tip: TIPLER.includes(x.tip) ? x.tip : "duz", kalinlik: +x.kalinlik || 2.5,
       egri: !!x.egri, kaynak: x.kaynak === "liste" ? "liste" : undefined}
    : x.tur === "ok"
    ? {tur: "ok", a: {lat: +x.bas.enlem, lon: +x.bas.boylam}, b: {lat: +x.uc.enlem, lon: +x.uc.boylam}, metin: x.metin || "", renk: x.renk || NOT_RENKLER[1], boyut: +x.boyut || 13}
    : {tur: "not", lat: +x.enlem, lon: +x.boylam, metin: x.metin || "", renk: x.renk || NOT_RENKLER[1], boyut: +x.boyut || 13});
  NOT_CIZGI = []; cizgiDugmeleri();
  listeKonumlariBagla();
  notListe();
  if (NOTLAR.length) hideEmpty();
  draw();
};
notListe();
cizgiDugmeleri();
