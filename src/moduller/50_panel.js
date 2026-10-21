/* ============ panel: listeden haritaya vurgu, sekme rozetleri ============ */
/* draw() bu dosyadaki fonksiyonları modül kodundan önce de çağırabilir: durum var ile, yardımcılar function ile. */
var VURGU = null;            // {tur: "alan"|"daire"|"nokta"|"olcum"|"not", ...}

function vurguBagla(el, nesne){
  el.addEventListener("mouseenter", () => { VURGU = nesne; el.classList.add("vurgu"); scheduleDraw(); });
  el.addEventListener("mouseleave", () => { if (VURGU === nesne) VURGU = null; el.classList.remove("vurgu"); scheduleDraw(); });
}

/* vurgulanan öğenin çevresine turuncu, beyaz kenarlı bir hat; baskıda çizilmez */
function drawVurgu(){
  const v = VURGU;
  if (!v || (typeof BASKI_SURUYOR !== "undefined" && BASKI_SURUYOR)) return;
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const ciz = yolKur => {
    ctx.beginPath(); yolKur();
    ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = "#f2a93b"; ctx.lineWidth = 3; ctx.stroke();
  };
  const halka = (lat, lon, r) => ciz(() => ctx.arc(sx(lon), sy(lat), r || 12, 0, 6.284));
  const hat = (pts, kapali) => ciz(() => { pts.forEach((p, i) => i ? ctx.lineTo(sx(p.lon), sy(p.lat)) : ctx.moveTo(sx(p.lon), sy(p.lat))); if (kapali) ctx.closePath(); });
  if (v.tur === "alan") hat(v.z.points, v.z.points.length > 2);
  else if (v.tur === "daire") ciz(() => CIRCLES.forEach(c => { if (c.label === v.label) traceFlat(c.ring, true); }));
  else if (v.tur === "nokta") halka(v.p.lat, v.p.lon);
  else if (v.tur === "olcum"){
    if (v.p) halka(v.p.lat, v.p.lon, 11);
    else if (v.ch.pts.length > 1) ciz(() => { for (let i = 1; i < v.ch.pts.length; i++) traceFlat(segBilgi(v.ch.pts[i - 1], v.ch.pts[i]).g, false); });
    else if (v.ch.pts.length) halka(v.ch.pts[0].lat, v.ch.pts[0].lon, 11);
  } else if (v.tur === "not"){
    const n = v.n;
    if (n.tur === "ok") hat([n.a, n.b]);
    else if (n.tur === "cizgi") ciz(() => cizgiYolu(n.pts, n.egri));
    else halka(n.lat, n.lon, 9);
  }
  ctx.restore();
}

/* ---- sekme rozetleri: araçtaki öğe sayısı ---- */
var ROZET_ESKI = "";
function rozetler(){
  if (typeof NOTLAR === "undefined" || !NOTLAR) return;
  const merkez = new Set(CIRCLES.map(c => c.li + "|" + c.lat + "|" + c.lon)).size;
  const say = {
    "pane-areas": ZONES.length, "pane-circles": merkez, "pane-rings": RINGS.length, "pane-points": POINTS.length,
    "pane-measure": MEASURE.reduce((s, ch) => s + ch.pts.length, 0), "pane-notes": NOTLAR.length
  };
  const anahtar = JSON.stringify(say);
  if (anahtar === ROZET_ESKI) return;
  ROZET_ESKI = anahtar;
  const ad = {"pane-areas": "alan", "pane-circles": "merkez", "pane-rings": "eğri", "pane-points": "nokta", "pane-measure": "ölçüm noktası", "pane-notes": "not"};
  Object.keys(say).forEach(id => {
    const t = document.querySelector('.tab[data-pane="' + id + '"]');
    if (!t) return;
    let r = t.querySelector(".rozet");
    if (!r){ r = document.createElement("span"); r.className = "rozet"; t.appendChild(r); }
    r.hidden = !say[id];
    r.textContent = say[id] > 99 ? "99+" : say[id];
    r.title = say[id] + " " + ad[id];
  });
}
