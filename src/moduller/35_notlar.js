/* ============ notlar ve oklar ============ */
/* Notlar sekmesi açıkken haritaya tıklamak not koyar; Ok kipinde iki tıklama bir ok çizer.
   Notlar ve oklar projeye kaydedilir, sürüklenerek taşınır. */
var NOTLAR = [];             // {tur:"not", lat, lon, metin, renk, boyut} | {tur:"ok", a:{lat,lon}, b:{lat,lon}, metin, renk}
var NOT_AKTIF = false, NOT_OK_BAS = null, NOT_IMLEC = null;
const NOT_RENKLER = ["#16222a", "#a4123f", "#00798c", "#e08e0b", "#3c6e2a", "#6a3d9a"];
function notKip(){ return document.querySelector('input[name="n-kip"]:checked').value; }

function notEkle(n){ NOTLAR.push(n); hideEmpty(); notListe(); draw(); degisti(); }

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
  if (!NOTLAR || (!NOTLAR.length && !NOT_OK_BAS)) return;     // var: modül kodundan önce de çağrılabilir
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  NOTLAR.forEach(n => {
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
  ctx.restore();
}

/* ---- sürükleyerek düzenleme (40_duzenle.js tutamaçlarına katılır) ---- */
function notTutamaclari(dene){
  if (!opt("opt-layer-notes")) return;
  NOTLAR.forEach(n => {
    if (n.tur === "ok"){
      dene(n.a.lat, n.a.lon, {tur: "not", ad: "Ok başı", tasi: (la, lo) => { n.a = {lat: la, lon: lo}; }, bitir: notListe});
      dene(n.b.lat, n.b.lon, {tur: "not", ad: "Ok ucu", tasi: (la, lo) => { n.b = {lat: la, lon: lo}; }, bitir: notListe});
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
    const inp = document.createElement(n.tur === "ok" ? "input" : "textarea");
    inp.className = "not-metin"; inp.value = n.metin || ""; inp.spellcheck = false;
    inp.placeholder = n.tur === "ok" ? "Ok etiketi (isteğe bağlı)" : "Not metni";
    if (n.tur !== "ok") inp.rows = Math.min(4, Math.max(1, (n.metin || "").split("\n").length));
    inp.oninput = () => { n.metin = inp.value; scheduleDraw(); };
    const meta = document.createElement("span");
    meta.className = "zone-meta";
    meta.textContent = n.tur === "ok"
      ? "Ok · " + fmtDist(vincenty(n.a.lat, n.a.lon, n.b.lat, n.b.lon).d) + " · " + String(Math.round(vincenty(n.a.lat, n.a.lon, n.b.lat, n.b.lon).az)).padStart(3, "0") + "°"
      : "Not · " + fk(n.lat, n.lon);
    const kutu = document.createElement("span");
    kutu.className = "zone-name"; kutu.append(inp, meta);
    row.append(swatch(n.renk, v => n.renk = v), kutu,
      smallBtn("odak", () => n.tur === "ok" ? focusOn(n.a.lat, n.a.lon, n.b.lat, n.b.lon) : focusOn(n.lat, n.lon, n.lat, n.lon)),
      smallBtn("sil", () => { NOTLAR.splice(i, 1); notListe(); draw(); degisti(); }));
    host.appendChild(row);
  });
}

/* ---- haritaya tıklama ---- */
cv.addEventListener("click", e => {
  if (!NOT_AKTIF || moved || PICK) return;
  const sn = snapAt(e.offsetX, e.offsetY);
  const lat = sn ? sn.lat : latAt(e.offsetY), lon = sn ? sn.lon : lonAt(e.offsetX);
  if (Math.abs(lat) > 85) return;
  const renk = $("n-renk").value, boyut = +$("n-boyut").value;
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
cv.addEventListener("mousemove", e => {
  if (NOT_AKTIF && NOT_OK_BAS){ NOT_IMLEC = {x: e.offsetX, y: e.offsetY}; scheduleDraw(); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && NOT_OK_BAS && !document.querySelector(".modal:not([hidden])")){ NOT_OK_BAS = null; draw(); }
});
document.querySelectorAll(".tab[data-pane]").forEach(t => t.addEventListener("click", () => {
  NOT_AKTIF = t.dataset.pane === "pane-notes";
  NOT_OK_BAS = null;
  if (NOT_AKTIF) cv.classList.add("measure");
  draw();
}));
document.querySelectorAll('input[name="n-kip"]').forEach(r => r.addEventListener("change", () => { NOT_OK_BAS = null; draw(); }));
$("btn-n-clear").onclick = () => { NOTLAR = []; NOT_OK_BAS = null; notListe(); draw(); };
$("opt-layer-notes").addEventListener("change", draw);
$("n-renk").value = NOT_RENKLER[1];

/* ---- proje dosyası ---- */
const projeToplaNotsuz = projeTopla;
projeTopla = function(){
  const o = projeToplaNotsuz();
  const r6 = v => Math.round(v * 1e6) / 1e6, k = p => ({enlem: r6(p.lat), boylam: r6(p.lon)});
  o.notlar = NOTLAR.map(n => n.tur === "ok"
    ? {tur: "ok", bas: k(n.a), uc: k(n.b), metin: n.metin || "", renk: n.renk, boyut: n.boyut}
    : Object.assign({tur: "not", metin: n.metin || "", renk: n.renk, boyut: n.boyut}, k(n)));
  return o;
};
const katmanlariTemizleNotsuz = katmanlariTemizle;
katmanlariTemizle = function(){ katmanlariTemizleNotsuz(); NOTLAR = []; NOT_OK_BAS = null; notListe(); };
const projeYukleNotsuz = projeYukle;
projeYukle = function(o){
  projeYukleNotsuz(o);
  const n = p => p && isFinite(p.enlem) && isFinite(p.boylam);
  NOTLAR = (o.notlar || []).filter(x => x.tur === "ok" ? n(x.bas) && n(x.uc) : n(x)).map(x => x.tur === "ok"
    ? {tur: "ok", a: {lat: +x.bas.enlem, lon: +x.bas.boylam}, b: {lat: +x.uc.enlem, lon: +x.uc.boylam}, metin: x.metin || "", renk: x.renk || NOT_RENKLER[1], boyut: +x.boyut || 13}
    : {tur: "not", lat: +x.enlem, lon: +x.boylam, metin: x.metin || "", renk: x.renk || NOT_RENKLER[1], boyut: +x.boyut || 13});
  notListe();
  if (NOTLAR.length) hideEmpty();
  draw();
};
notListe();
