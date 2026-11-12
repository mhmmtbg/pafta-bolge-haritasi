/* ============ noktalar: alanların dışında kalan noktalar ============ */
/* draw() bu dosyadaki fonksiyonları modül kodundan önce de çağırabilir: durum var ile, yardımcılar function ile. */
var DIS = {sig: "", dis: null, n: 0, disSay: 0, alanSay: 0, metin: "", adlar: []};

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
  const hedefEl = document.getElementById("p-dis-hedef"), hedef = hedefEl ? hedefEl.value : "";
  const sig = [view.mode, view.phi0, alanlar.length, daireler.length, k, a.toFixed(6), POINTS.length, b.toFixed(6), hedef].join("|");
  if (DIS.sig === sig) return DIS;
  const polys = [];
  const ekle = (xy, ad) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < xy.length; i += 2){ if (xy[i] < x0) x0 = xy[i]; if (xy[i] > x1) x1 = xy[i]; if (xy[i+1] < y0) y0 = xy[i+1]; if (xy[i+1] > y1) y1 = xy[i+1]; }
    polys.push({xy, x0, x1, y0, y1, ad, ic: 0});
  };
  for (const z of alanlar){ const xy = []; z.points.forEach(p => xy.push(wx(p.lon), wy(p.lat))); ekle(xy, z.name); }
  for (const c of daireler){ const xy = []; for (let i = 0; i < c.ring.length; i += 2) xy.push(wx(c.ring[i]), wy(c.ring[i+1])); ekle(xy, c.name + " " + c.label); }
  // aynı adlı alanlar ayırt edilsin
  const adSay = {}; polys.forEach(q => adSay[q.ad] = (adSay[q.ad] || 0) + 1);
  const adSira = {}; polys.forEach(q => { if (adSay[q.ad] > 1){ adSira[q.ad] = (adSira[q.ad] || 0) + 1; q.ad += " (" + adSira[q.ad] + ")"; } });
  const hi = hedef === "" ? -1 : polys.findIndex(q => q.ad === hedef);      // vurgulanacak: -1 = hiçbir alanın içinde olmayanlar
  const dis = new Set();
  let ic = 0;
  for (const p of POINTS){
    const x = wx(p.lon), y = wy(p.lat);
    let icinde = false, hedefte = false;
    for (let qi = 0; qi < polys.length; qi++){
      const q = polys[qi];
      if (x < q.x0 || x > q.x1 || y < q.y0 || y > q.y1) continue;
      const v = q.xy; let c = false;
      for (let i = 0, j = v.length - 2; i < v.length; j = i, i += 2)
        if ((v[i+1] > y) !== (v[j+1] > y) && x < (v[j] - v[i]) * (y - v[i+1]) / (v[j+1] - v[i+1]) + v[i]) c = !c;
      if (c){ icinde = true; q.ic++; if (qi === hi) hedefte = true; }
    }
    if (icinde) ic++;
    if (hi >= 0 ? !hedefte : !icinde) dis.add(p);
  }
  const n = POINTS.length, f = v => v.toLocaleString("tr-TR");
  const yuz = v => "%" + (100 * v / n).toLocaleString("tr-TR", {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const satir = (ad, v) => '<div class="dis-satir"><span>' + esc(ad) + '</span><span><b>' + f(v) + "</b> nokta · " + yuz(v) + "</span></div>";
  DIS = {sig, dis: polys.length ? dis : null, n, disSay: n - ic, alanSay: polys.length, adlar: polys.map(q => q.ad), hedef: hi >= 0 ? polys[hi].ad : "",
    metin: polys.length
      ? '<div class="dis-baslik">Toplam <b>' + f(n) + "</b> nokta" + (hi >= 0 ? " · vurgulanan: " + esc(polys[hi].ad) + " dışındakiler" : "") + "</div>" +
        '<div class="dis-liste">' + polys.map(q => satir(q.ad + " dışında", n - q.ic)).join("") + "</div>" +
        (polys.length > 1 ? '<div class="dis-ozet">' + satir("Hiçbir " + (daireler.length ? "alan ya da dairenin" : "alanın") + " içinde olmayan", n - ic) + "</div>" : "")
      : '<span class="warn">Çizili alan yok; dışarıda sayılacak bir şey yok.</span>'};
  return DIS;
}
function disSonucYaz(){
  const el = document.getElementById("p-dis-sonuc");
  if (!el) return;
  const acik = disAcik(), d = acik ? DIS : null;
  const m = d && d.metin ? d.metin : "";
  if (el.dataset.m !== m){ el.dataset.m = m; el.innerHTML = m; }
  el.hidden = !m;
  const r = document.getElementById("p-dis-daire-satir"); if (r) r.hidden = !acik;
  // vurgulanacak alan seçimi: alan adları değişince seçenekler yenilenir
  const sel = document.getElementById("p-dis-hedef"), sr = document.getElementById("p-dis-hedef-satir");
  if (!sel) return;
  const adlar = d && d.adlar ? d.adlar : [];
  sr.hidden = !acik || adlar.length < 2;
  const anahtar = adlar.join("\u0001");
  if (sel.dataset.a !== anahtar){
    const eski = sel.value;
    sel.dataset.a = anahtar;
    sel.innerHTML = '<option value="">hiçbir alanın içinde olmayanlar</option>' + adlar.map(a => '<option value="' + esc(a) + '">' + esc(a) + " dışındakiler</option>").join("");
    sel.value = adlar.includes(eski) ? eski : "";
  }
}

/* dışarıdaki noktalar kırmızı halkayla; baskıda çizilmez */
function drawNoktaVurgu(){
  if (typeof BASKI_SURUYOR !== "undefined" && BASKI_SURUYOR) return;
  const d = disHesapla();
  disSonucYaz();
  if (!(d && d.dis && d.dis.size)) return;
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
  ctx.restore();
}

$("p-dis").addEventListener("change", () => { disSonucYaz(); scheduleDraw(); });
$("p-dis-daire").addEventListener("change", () => scheduleDraw());
$("p-dis-hedef").addEventListener("change", () => scheduleDraw());
disSonucYaz();
