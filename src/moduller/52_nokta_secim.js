/* ============ noktalar: listeden seçilen noktayı vurgulama, alanların dışında kalan noktalar ============ */
/* draw() bu dosyadaki fonksiyonları modül kodundan önce de çağırabilir: durum var ile, yardımcılar function ile. */
var NOKTA_SEC = null;                       // listeden seçilen nokta (POINTS öğesi)
var DIS = {sig: "", dis: null, n: 0, disSay: 0, alanSay: 0, metin: ""};

function disAcik(){ const e = document.getElementById("p-dis"); return !!(e && e.checked); }

/* Noktaların alanların dışında olup olmadığı: ekrandaki çizgiyle aynı geometri için izdüşüm koordinatında (wx, wy) çokgen içi sınaması.
   Sonuç; alanların, dairelerin, noktaların ve görünüm kipinin değişmediği sürece önbellekten gelir. */
function disHesapla(){
  if (!disAcik() || typeof POINTS === "undefined" || !POINTS.length) return null;
  const dairede = document.getElementById("p-dis-daire").checked;
  const alanlar = opt("opt-layer-areas") ? ZONES.filter(z => z.visible && z.points.length > 2) : [];
  const daireler = dairede && opt("opt-layer-circles") ? CIRCLES : [];
  let a = 0, k = 0;
  for (const z of alanlar) for (const p of z.points){ a += p.lat * (k % 13 + 1) + p.lon * (k % 7 + 1); k++; }
  for (const c of daireler){ a += c.lat * 3 + c.lon * 5 + c.d; k++; }
  let b = 0;
  for (let i = 0; i < POINTS.length; i++) b += POINTS[i].lat * (i % 11 + 1) + POINTS[i].lon * (i % 5 + 1);
  const sig = [view.mode, view.phi0, alanlar.length, daireler.length, k, a.toFixed(6), POINTS.length, b.toFixed(6)].join("|");
  if (DIS.sig === sig) return DIS;
  const polys = [];
  const ekle = (xy) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < xy.length; i += 2){ if (xy[i] < x0) x0 = xy[i]; if (xy[i] > x1) x1 = xy[i]; if (xy[i+1] < y0) y0 = xy[i+1]; if (xy[i+1] > y1) y1 = xy[i+1]; }
    polys.push({xy, x0, x1, y0, y1});
  };
  for (const z of alanlar){ const xy = []; z.points.forEach(p => xy.push(wx(p.lon), wy(p.lat))); ekle(xy); }
  for (const c of daireler){ const xy = []; for (let i = 0; i < c.ring.length; i += 2) xy.push(wx(c.ring[i]), wy(c.ring[i+1])); ekle(xy); }
  const dis = new Set();
  let ic = 0;
  for (const p of POINTS){
    const x = wx(p.lon), y = wy(p.lat);
    let icinde = false;
    for (const q of polys){
      if (x < q.x0 || x > q.x1 || y < q.y0 || y > q.y1) continue;
      const v = q.xy; let c = false;
      for (let i = 0, j = v.length - 2; i < v.length; j = i, i += 2)
        if ((v[i+1] > y) !== (v[j+1] > y) && x < (v[j] - v[i]) * (y - v[i+1]) / (v[j+1] - v[i+1]) + v[i]) c = !c;
      if (c){ icinde = true; break; }
    }
    if (icinde) ic++; else dis.add(p);
  }
  const n = POINTS.length, f = v => v.toLocaleString("tr-TR");
  const yuz = v => "%" + (100 * v / n).toLocaleString("tr-TR", {minimumFractionDigits: 1, maximumFractionDigits: 1});
  DIS = {sig, dis: polys.length ? dis : null, n, disSay: n - ic, alanSay: polys.length,
    metin: polys.length
      ? '<b>' + f(n - ic) + '</b> / ' + f(n) + ' nokta ' + (daireler.length ? "alan ve dairelerin" : "alanların") + ' dışında (' + yuz(n - ic) + '); ' + f(ic) + ' nokta içinde (' + yuz(ic) + ').'
      : '<span class="warn">Çizili alan yok; dışarıda sayılacak bir şey yok.</span>'};
  return DIS;
}
function disSonucYaz(){
  const el = document.getElementById("p-dis-sonuc");
  if (!el) return;
  const d = disAcik() ? DIS : null;
  const m = d && d.metin ? d.metin : "";
  if (el.dataset.m !== m){ el.dataset.m = m; el.innerHTML = m; }
  el.hidden = !m;
  const r = document.getElementById("p-dis-daire-satir"); if (r) r.hidden = !disAcik();
}

/* dışarıdaki noktalar kırmızı halkayla, listeden seçilen nokta turuncu halkayla; baskıda çizilmez */
function drawNoktaVurgu(){
  if (typeof BASKI_SURUYOR !== "undefined" && BASKI_SURUYOR) return;
  const d = disHesapla();
  disSonucYaz();
  const sec = NOKTA_SEC && typeof POINTS !== "undefined" ? NOKTA_SEC : null;
  if (!(d && d.dis && d.dis.size) && !sec) return;
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (d && d.dis && d.dis.size && PT_EKRAN){
    const r = (parseFloat($("p-size").value) || 6) + 4, g = new Set(), kal = [];
    for (const v of PT_EKRAN){
      if (!d.dis.has(v[2])) continue;
      const k = Math.floor(v[0] / 5) * 100003 + Math.floor(v[1] / 5);           // sıkışıkta piksel başına bir halka
      if (g.has(k)) continue; g.add(k); kal.push(v);
    }
    if (kal.length){
      ctx.beginPath(); for (const v of kal){ ctx.moveTo(v[0] + r, v[1]); ctx.arc(v[0], v[1], r, 0, 6.284); }
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = "#d7263d"; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  if (sec){
    const X = sx(sec.lon), Y = sy(sec.lat);
    ctx.beginPath(); ctx.arc(X, Y, 13, 0, 6.284);
    ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = "#f2a93b"; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.restore();
}

$("p-dis").addEventListener("change", () => { disSonucYaz(); scheduleDraw(); });
$("p-dis-daire").addEventListener("change", () => scheduleDraw());
disSonucYaz();
