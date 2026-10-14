/* ============ alan etiketleri ve alan stilleri ============ */
/* Etiket: poligonun içinde kenara en uzak nokta (polylabel); ekrandan taşan alanlarda görünen parçanın içinde.
   Stil: alan başına dolgu (düz, tarama, çapraz tarama, yok) ve sınır (düz, kesikli, taraklı: ICAO kısıtlı saha).
   Bu dosyada draw() tarafından çağrılan her şey function bildirimi ya da var'dır (modül kodundan önce de çalışır). */

var ALAN_DOLGULAR = {duz: "düz", tarama: "tarama", capraz: "çapraz tarama", yok: "dolgusuz"};
var ALAN_SINIRLAR = {duz: "düz", kesikli: "kesikli", tarakli: "taraklı (kısıtlı saha)"};

/* ---- polylabel (Mapbox, sadeleştirilmiş): halka [[x,y],...] içinde kenara en uzak nokta ---- */
function polyKenarUzak(x, y, h){
  let ic = false, en = Infinity;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++){
    const [ax, ay] = h[i], [bx, by] = h[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) ic = !ic;
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    en = Math.min(en, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
  }
  return (ic ? 1 : -1) * Math.sqrt(en);
}
function polylabelJS(h, hassas){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  h.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const w = x1 - x0, hh = y1 - y0;
  if (!(Math.max(w, hh) > 0)) return [(x0 + x1) / 2, (y0 + y1) / 2, 0];
  const boy = Math.max(Math.min(w, hh), Math.max(w, hh) / 40);      // çok ince şekillerde hücre sayısı sınırlı kalsın
  hassas = Math.max(hassas || 0, Math.max(w, hh) / 300);
  const hucre = (x, y, r) => { const d = polyKenarUzak(x, y, h); return {x, y, r, d, en: d + r * Math.SQRT2}; };
  const kuyruk = [];
  for (let x = x0; x < x1; x += boy) for (let y = y0; y < y1; y += boy) kuyruk.push(hucre(x + boy / 2, y + boy / 2, boy / 2));
  // başlangıç: ağırlık merkezi
  let A = 0, cx = 0, cy = 0;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++){
    const f = h[i][0] * h[j][1] - h[j][0] * h[i][1];
    cx += (h[i][0] + h[j][0]) * f; cy += (h[i][1] + h[j][1]) * f; A += f * 3;
  }
  let iyi = A ? hucre(cx / A, cy / A, 0) : hucre(h[0][0], h[0][1], 0);
  const bb = hucre(x0 + w / 2, y0 + hh / 2, 0);
  if (bb.d > iyi.d) iyi = bb;
  let tur = 0;
  while (kuyruk.length && tur++ < 1500){
    let k = 0;
    for (let i = 1; i < kuyruk.length; i++) if (kuyruk[i].en > kuyruk[k].en) k = i;
    const c = kuyruk.splice(k, 1)[0];
    if (c.d > iyi.d) iyi = c;
    if (c.en - iyi.d <= hassas) continue;
    const r = c.r / 2;
    kuyruk.push(hucre(c.x - r, c.y - r, r), hucre(c.x + r, c.y - r, r), hucre(c.x - r, c.y + r, r), hucre(c.x + r, c.y + r, r));
  }
  return [iyi.x, iyi.y, iyi.d];
}
/* Sutherland–Hodgman: halkayı dikdörtgene kırp */
function halkaKirp(h, x0, y0, x1, y1){
  const kenar = [[p => p[0] >= x0, (a, b) => kes(a, b, 0, x0)], [p => p[0] <= x1, (a, b) => kes(a, b, 0, x1)],
                 [p => p[1] >= y0, (a, b) => kes(a, b, 1, y0)], [p => p[1] <= y1, (a, b) => kes(a, b, 1, y1)]];
  function kes(a, b, e, v){ const t = (v - a[e]) / (b[e] - a[e]); return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; }
  let out = h;
  for (const [ic, kesis] of kenar){
    const gir = out; out = [];
    if (!gir.length) break;
    for (let i = 0; i < gir.length; i++){
      const a = gir[i], b = gir[(i + 1) % gir.length];
      if (ic(b)){ if (!ic(a)) out.push(kesis(a, b)); out.push(b); }
      else if (ic(a)) out.push(kesis(a, b));
    }
  }
  return out;
}
/* etiket yeri (ekran px). Tüm alan ekrandaysa dünya koordinatında bir kez hesaplanıp önbelleğe alınır. */
function alanEtiketYeri(z, pts){
  if (pts.length < 3) return pts.length ? [pts[0][0], pts[0][1] - 18, 0] : null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const ekranda = x0 >= 0 && y0 >= 0 && x1 <= W && y1 <= H;
  if (ekranda){
    const anahtar = view.mode + "|" + view.phi0 + "|" + z.points.map(p => p.lat.toFixed(6) + "," + p.lon.toFixed(6)).join(";");
    if (!z._etiket || z._etiket.anahtar !== anahtar){
      const dunya = z.points.map(p => [wx(p.lon), wy(p.lat)]);
      const r = polylabelJS(dunya);
      z._etiket = {anahtar, x: r[0], y: r[1], d: r[2]};
    }
    const e = z._etiket;
    return [W / 2 + (e.x - view.cx) * view.k, H / 2 - (e.y - view.cy) * view.k, e.d * view.k];
  }
  const kirp = halkaKirp(pts, 8, 8, W - 8, H - 8);
  if (kirp.length < 3) return null;
  return polylabelJS(kirp, 1);
}

/* ---- dolgu desenleri (renk + tür + saydamlık başına bir kez) ---- */
var DESENLER = {};
function alanDeseni(renk, tur, alfa){
  const k = renk + tur + alfa;
  if (DESENLER[k]) return DESENLER[k];
  const c = document.createElement("canvas"), n = 10;
  c.width = c.height = n;
  const g = c.getContext("2d");
  g.strokeStyle = hexA(renk, Math.min(1, alfa * 3.2)); g.lineWidth = 1.2; g.lineCap = "square";
  g.beginPath();
  g.moveTo(0, n); g.lineTo(n, 0); g.moveTo(-n / 2, n / 2); g.lineTo(n / 2, -n / 2); g.moveTo(n / 2, n * 1.5); g.lineTo(n * 1.5, n / 2);
  if (tur === "capraz"){ g.moveTo(0, 0); g.lineTo(n, n); g.moveTo(-n / 2, n / 2); g.lineTo(n / 2, n * 1.5); g.moveTo(n / 2, -n / 2); g.lineTo(n * 1.5, n / 2); }
  g.stroke();
  return DESENLER[k] = ctx.createPattern(c, "repeat");
}

/* ---- taraklı sınır: kenar boyunca içe doğru kısa dişler ---- */
function tarakCiz(pts, renk){
  let A = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) A += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
  const yon = A > 0 ? 1 : -1;                                  // ekran koordinatında (y aşağı) iç tarafa dönen normal
  const ara = 7, boy = 6;
  ctx.beginPath();
  let kalan = ara / 2;
  for (let i = 0; i < pts.length; i++){
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const L = Math.hypot(bx - ax, by - ay);
    if (!L) continue;
    const ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy * yon, ny = ux * yon;
    let s = kalan;
    while (s < L){
      const x = ax + ux * s, y = ay + uy * s;
      ctx.moveTo(x, y); ctx.lineTo(x + nx * boy, y + ny * boy);
      s += ara;
    }
    kalan = s - L;
  }
  ctx.strokeStyle = renk; ctx.lineWidth = 1.4; ctx.stroke();
}

/* ---- dolgu yoğunluğu (Görünüm sürgüsü) ---- */
function dolguAlfa(){
  const e = document.getElementById("opt-fill-alpha");
  const v = e ? +e.value / 100 : .16;
  return SAT ? Math.min(.9, v + .08) : v;
}
