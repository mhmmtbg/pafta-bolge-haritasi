/* ============ seçim: haritadaki öğeleri seçme, listelerde işaretleme, Delete ile silme ============ */
/* draw() bu dosyadaki fonksiyonları modül kodundan önce de çağırabilir: durum var ile, yardımcılar function ile. */
var SEC = null;                      // Map: öğe nesnesi -> {tur, o, key, ...}; tur: alan, daire, egri, nokta, olcumNokta, olcumHat, not
var KUTU = null;                     // Shift+sürükleme ile çizilen seçim dikdörtgeni
var SEC_IMZA = null;
const SEC_MAVI = "#3b8de0";
const SEC_AD = {alan: "alan", daire: "daire", egri: "mesafe eğrisi", nokta: "nokta", olcumNokta: "ölçüm noktası", olcumHat: "ölçüm hattı", not: "not"};

function secD(tur, o, ek){ return Object.assign({tur, o, key: o}, ek || {}); }
function secimAcik(){ return !PICK && !MEASURE_ACTIVE && !NOT_AKTIF; }

/* ---- listelerdeki satırlar: tıklayınca seçilir, seçiliyse işaretlenir ---- */
function secimBagla(row, descs, listeden){
  if (!SEC) return;
  row._sec = descs;
  if (descs.some(d => SEC.has(d.key))) row.classList.add("secili");
  row.addEventListener("click", e => {
    if (e.target.closest("button, input, textarea, select, a")) return;
    secimTikla(descs, e, true);
  });
}
function secimMerkez(d){
  const o = d.o;
  if (d.tur === "nokta" || d.tur === "olcumNokta") return [o.lat, o.lon];
  if (d.tur === "not") return o.tur === "ok" ? [o.a.lat, o.a.lon] : o.tur === "cizgi" ? [o.pts[0].lat, o.pts[0].lon] : [o.lat, o.lon];
  if (d.tur === "daire") return [o.lat, o.lon];
  if (d.tur === "alan" && o.points.length) return [o.points[0].lat, o.points[0].lon];
  if (d.tur === "olcumHat" && o.pts.length) return [o.pts[0].lat, o.pts[0].lon];
  return null;
}
function secimTikla(descs, e, listeden){
  const ekle = e && (e.ctrlKey || e.metaKey || e.shiftKey);
  const hepsi = descs.every(d => SEC.has(d.key));
  if (ekle) descs.forEach(d => { if (hepsi) SEC.delete(d.key); else SEC.set(d.key, d); });
  else { const ayni = hepsi && SEC.size === descs.length; SEC.clear(); if (!ayni) descs.forEach(d => SEC.set(d.key, d)); }
  if (listeden && SEC.size === 1){                                  // listeden seçilen öğe ekran dışındaysa harita ona kayar
    const m = secimMerkez(descs[0]);
    if (m && SEC.has(descs[0].key)){
      const X = sx(m[1]), Y = sy(m[0]);
      if (X < 30 || X > W - 30 || Y < 30 || Y > H - 30){ view.cx = wx(m[1]); view.cy = wy(m[0]); }
    }
  }
  secimYenile(); draw();
}
function secimTemizle(){ if (SEC && SEC.size){ SEC.clear(); secimYenile(); draw(); } }

function secimYenile(){
  if (!SEC) return;
  document.querySelectorAll(".panel .zone, .panel .chain-head, .panel .mpt").forEach(r => {
    if (r._sec) r.classList.toggle("secili", r._sec.some(d => SEC.has(d.key)));
  });
  if (typeof noktaPencere === "function"){ PL.bas = PL.son = -1; noktaPencere(); }
  if (typeof olcumPencere === "function"){ ML.bas = ML.son = -1; olcumPencere(); }
  const bar = $("secim-cubuk"), n = SEC.size;
  bar.classList.toggle("on", n > 0 && secimAcik());
  if (n){
    const say = {};
    SEC.forEach(d => say[d.tur] = (say[d.tur] || 0) + 1);
    const parca = Object.keys(say).map(t => say[t].toLocaleString("tr-TR") + " " + SEC_AD[t]).join(", ");
    $("secim-metin").textContent = n.toLocaleString("tr-TR") + " öğe seçili" + (Object.keys(say).length > 1 || n > 1 ? " (" + parca + ")" : "");
  }
}

/* veriler değişince (yeniden çizim, silme, geri al) artık var olmayan öğeler seçimden düşer */
function secimDogrula(){
  if (!SEC || !SEC.size) return;
  let nm = 0; MEASURE.forEach(ch => nm += ch.pts.length);
  const imza = [ZONES, ZONES.length, CIRCLES, CIRCLES.length, RINGS, RINGS.length, POINTS, POINTS.length, NOTLAR, NOTLAR.length, MEASURE, MEASURE.length, nm];
  if (SEC_IMZA && imza.every((v, i) => v === SEC_IMZA[i])) return;
  SEC_IMZA = imza;
  const z = new Set(ZONES), c = new Set(CIRCLES), r = new Set(RINGS), n = new Set(NOTLAR), ch = new Set(MEASURE), mp = new Set();
  MEASURE.forEach(h => h.pts.forEach(p => mp.add(p)));
  const p = SEC.size && [...SEC.values()].some(d => d.tur === "nokta") ? new Set(POINTS) : null;
  let dustu = false;
  [...SEC.entries()].forEach(([k, d]) => {
    const var_ = d.tur === "alan" ? z.has(k) : d.tur === "daire" ? c.has(k) : d.tur === "egri" ? r.has(k) : d.tur === "not" ? n.has(k)
               : d.tur === "olcumHat" ? ch.has(k) : d.tur === "olcumNokta" ? mp.has(k) : p ? p.has(k) : true;
    if (!var_){ SEC.delete(k); dustu = true; }
  });
  if (dustu) setTimeout(secimYenile, 0);
}

/* ---- haritada nesne bulma (tıklama) ---- */
function yolVurdu(x, y, yolKur, genis){
  ctx.save();
  ctx.setLineDash([]); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = genis || 12;
  ctx.beginPath(); yolKur();
  const r = ctx.isPointInStroke(x * dpr, y * dpr);
  ctx.restore();
  return r;
}
function notKutuHesap(n, X, Y){
  const fs = n.boyut || 13, sat = String(n.metin || (n.tur === "not" ? "Not" : "")).split("\n").slice(0, 8);
  ctx.save(); ctx.font = "600 " + fs + "px " + FONT();
  const w = Math.max(...sat.map(s => ctx.measureText(s).width)) + 14, h = sat.length * (fs + 4) + 8;
  ctx.restore();
  return [X + 8, Y - h - 8, w, h];
}
function secimBul(x, y){
  // 1 · noktalar
  if (opt("opt-layer-points") && POINTS.length){
    const r = Math.max(8, (parseFloat($("p-size").value) || 6) + 4);
    let en = null, bd = r;
    for (const p of POINTS){
      const dx = sx(p.lon) - x; if (dx >= bd || dx <= -bd) continue;
      const d = Math.hypot(dx, sy(p.lat) - y);
      if (d <= bd){ bd = d; en = p; }
    }
    if (en) return secD("nokta", en);
  }
  // 2 · ölçüm noktaları
  if (opt("opt-layer-measure"))
    for (const ch of MEASURE) for (const p of ch.pts) if (Math.hypot(sx(p.lon) - x, sy(p.lat) - y) < 10) return secD("olcumNokta", p, {ch});
  // 3 · notlar
  if (opt("opt-layer-notes")) for (let i = NOTLAR.length - 1; i >= 0; i--){
    const n = NOTLAR[i];
    if (n.tur === "not"){
      const X = sx(n.lon), Y = sy(n.lat), b = notKutuHesap(n, X, Y);
      if (Math.hypot(X - x, Y - y) < 8 || (x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3])) return secD("not", n);
    } else if (n.tur === "ok"){
      const x1 = sx(n.a.lon), y1 = sy(n.a.lat), b = n.metin ? notKutuHesap(n, x1, y1) : null;
      if (yolVurdu(x, y, () => { ctx.moveTo(x1, y1); ctx.lineTo(sx(n.b.lon), sy(n.b.lat)); }, 12) || (b && x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3])) return secD("not", n);
    } else if (yolVurdu(x, y, () => cizgiYolu(n.pts, n.egri), 12)) return secD("not", n);
  }
  // 4 · alan köşeleri
  if (opt("opt-layer-areas"))
    for (const z of ZONES){ if (z.visible) for (const p of z.points) if (Math.hypot(sx(p.lon) - x, sy(p.lat) - y) < 7) return secD("alan", z); }
  // 5 · çizgiler: ölçüm hattı, daire, alan kenarı, mesafe eğrisi
  if (opt("opt-layer-measure"))
    for (const ch of MEASURE) if (ch.pts.length > 1 && yolVurdu(x, y, () => { for (let i = 1; i < ch.pts.length; i++) traceFlat(segBilgi(ch.pts[i-1], ch.pts[i]).g, false); }, 12)) return secD("olcumHat", ch);
  if (opt("opt-layer-circles"))
    for (const c of CIRCLES) if (yolVurdu(x, y, () => traceFlat(c.ring, true), 10)) return secD("daire", c);
  if (opt("opt-layer-areas"))
    for (const z of ZONES) if (z.visible && z.points.length > 1 && yolVurdu(x, y, () => { z.points.forEach((p, i) => i ? ctx.lineTo(sx(p.lon), sy(p.lat)) : ctx.moveTo(sx(p.lon), sy(p.lat))); if (z.points.length > 2) ctx.closePath(); }, 10)) return secD("alan", z);
  if (opt("opt-layer-rings"))
    for (const lv of RINGS) if (yolVurdu(x, y, () => lv.lines.forEach(l => traceFlat(l, false)), 10)) return secD("egri", lv);
  // 6 · alanın içi (en küçük alan öncelikli)
  if (opt("opt-layer-areas")){
    let en = null, ea = Infinity;
    for (const z of ZONES){
      if (!z.visible || z.points.length < 3) continue;
      ctx.save(); ctx.beginPath();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      z.points.forEach((p, i) => { const X = sx(p.lon), Y = sy(p.lat); if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.closePath();
      const ic = x >= x0 && x <= x1 && y >= y0 && y <= y1 && ctx.isPointInPath(x * dpr, y * dpr);
      ctx.restore();
      if (ic && (x1 - x0) * (y1 - y0) < ea){ ea = (x1 - x0) * (y1 - y0); en = z; }
    }
    if (en) return secD("alan", en);
  }
  return null;
}

/* ---- dikdörtgenle seçim (Shift + sürükle) ve tümünü seçme ---- */
function secimTopla(icinde, tumu){
  const l = [];
  const ic = (lat, lon) => icinde(sx(lon), sy(lat));
  if (opt("opt-layer-points")) for (const p of POINTS) if (ic(p.lat, p.lon)) l.push(secD("nokta", p));
  if (opt("opt-layer-areas")) for (const z of ZONES) if (z.visible && z.points.length && z.points.every(p => ic(p.lat, p.lon))) l.push(secD("alan", z));
  if (opt("opt-layer-circles")) for (const c of CIRCLES){
    let ok = true; for (let i = 0; i < c.ring.length && ok; i += 2) ok = icinde(sx(c.ring[i]), sy(c.ring[i+1]));
    if (ok) l.push(secD("daire", c));
  }
  if (opt("opt-layer-measure")) for (const ch of MEASURE){
    if (!ch.pts.length) continue;
    if (tumu || ch.pts.every(p => ic(p.lat, p.lon))){ l.push(secD("olcumHat", ch)); continue; }
    ch.pts.forEach(p => { if (ic(p.lat, p.lon)) l.push(secD("olcumNokta", p, {ch})); });
  }
  if (opt("opt-layer-notes")) for (const n of NOTLAR){
    const ok = n.tur === "ok" ? ic(n.a.lat, n.a.lon) && ic(n.b.lat, n.b.lon) : n.tur === "cizgi" ? n.pts.every(p => ic(p.lat, p.lon)) : ic(n.lat, n.lon);
    if (ok) l.push(secD("not", n));
  }
  if (tumu && opt("opt-layer-rings")) RINGS.forEach(lv => l.push(secD("egri", lv)));
  return l;
}
function secimKutu(k, ekle){
  const x0 = Math.min(k.x0, k.x1), x1 = Math.max(k.x0, k.x1), y0 = Math.min(k.y0, k.y1), y1 = Math.max(k.y0, k.y1);
  const l = secimTopla((x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, false);
  if (!ekle) SEC.clear();
  l.forEach(d => SEC.set(d.key, d));
  secimYenile(); draw();
}

/* ---- çizim ---- */
function drawSecim(){
  if (!SEC || (typeof BASKI_SURUYOR !== "undefined" && BASKI_SURUYOR)) return;
  if (SEC.size){
    secimDogrula();
    const noktalar = [], olcum = [];
    SEC.forEach(d => {
      if (d.tur === "nokta") noktalar.push(d.o);
      else if (d.tur === "olcumNokta") olcum.push(d.o);
      else if (d.tur === "alan") vurguCiz({tur: "alan", z: d.o}, SEC_MAVI);
      else if (d.tur === "daire") vurguCiz({tur: "daire", c: d.o}, SEC_MAVI);
      else if (d.tur === "egri") vurguCiz({tur: "egri", lv: d.o}, SEC_MAVI);
      else if (d.tur === "olcumHat") vurguCiz({tur: "olcum", ch: d.o}, SEC_MAVI);
      else if (d.tur === "not") vurguCiz({tur: "not", n: d.o}, SEC_MAVI);
    });
    const halkalar = (liste, r) => {
      const g = new Set();
      ctx.save(); ctx.beginPath();
      for (const p of liste){
        const X = sx(p.lon), Y = sy(p.lat);
        if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue;
        const k = Math.floor(X / 5) * 100003 + Math.floor(Y / 5);
        if (g.has(k)) continue; g.add(k);
        ctx.moveTo(X + r, Y); ctx.arc(X, Y, r, 0, 6.284);
      }
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = SEC_MAVI; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.restore();
    };
    if (noktalar.length) halkalar(noktalar, (parseFloat($("p-size").value) || 6) + 5);
    if (olcum.length) halkalar(olcum, 12);
  }
  if (KUTU && KUTU.basladi){
    const x = Math.min(KUTU.x0, KUTU.x1), y = Math.min(KUTU.y0, KUTU.y1), w = Math.abs(KUTU.x1 - KUTU.x0), h = Math.abs(KUTU.y1 - KUTU.y0);
    ctx.save();
    ctx.fillStyle = "rgba(59,141,224,.12)"; ctx.fillRect(x, y, w, h);
    ctx.setLineDash([6, 4]); ctx.strokeStyle = SEC_MAVI; ctx.lineWidth = 1.5; ctx.strokeRect(x + .5, y + .5, w, h);
    ctx.restore();
  }
}

/* ---- silme: nesne ve listeden geldiği metin satırı birlikte ---- */
function satirUyar(satir, cs, kirp){
  if (satir == null || cs == null) return false;
  const bak = kirp ? kirp(satir) : satir, lead = bak.length - bak.trimStart().length;
  const ok = (k, kay) => k && !k.hata && k.start + kay === cs;
  return ok(koordBul(bak), 0) || ok(koordBul(bak.trim()), lead);
}
/* hedefler [{li, cs}] satırlarını metin kutusundan siler (satır elle değişmişse dokunmaz), kalan nesnelerin satır numaralarını kaydırır; atlanan satır sayısını döndürür */
function satirlariSil(taId, hedefler, kalan, kirp){
  const ta = $(taId), satirlar = ta.value.split("\n"), sil = new Set(), gordu = new Set();
  let atla = 0;
  hedefler.forEach(h => {
    if (h.li == null || gordu.has(h.li)) return;
    gordu.add(h.li);
    if (satirUyar(satirlar[h.li], h.cs, kirp)) sil.add(h.li); else atla++;
  });
  if (sil.size){
    const harita = new Int32Array(satirlar.length + 1); let n = 0;
    for (let i = 0; i < satirlar.length; i++){ harita[i] = i - n; if (sil.has(i)) n++; }
    ta.value = satirlar.filter((_, i) => !sil.has(i)).join("\n");
    kalan.forEach(o => { if (typeof o.li === "number" && o.li < harita.length) o.li = harita[o.li]; });
  }
  return atla;
}
function secimSil(){
  secimDogrula();
  const ds = [...SEC.values()];
  if (!ds.length) return;
  if (typeof gecmisKaydet === "function") gecmisKaydet();           // silmeden önceki durum geri alınabilsin
  const by = t => ds.filter(d => d.tur === t).map(d => d.o);
  let atla = 0;
  const zs = new Set(by("alan"));
  if (zs.size){
    const h = []; zs.forEach(z => z.points.forEach(p => h.push({li: p.li, cs: p.cs})));
    const kalan = ZONES.filter(z => !zs.has(z));
    atla += satirlariSil("input", h, kalan.flatMap(z => z.points));
    ZONES = kalan; renderZoneList();
  }
  const ps = new Set(by("nokta"));
  if (ps.size){
    const h = [...ps].map(p => ({li: p.li, cs: p.cs}));
    POINTS = POINTS.filter(p => !ps.has(p));
    atla += satirlariSil("p-input", h, POINTS, renkKirp);
    pointList();
  }
  const cd = new Set(by("daire"));
  if (cd.size){
    const kalan = CIRCLES.filter(c => !cd.has(c)), canli = new Set(kalan.map(c => c.li)), h = [];
    cd.forEach(c => { if (c.li != null && !canli.has(c.li)) h.push({li: c.li, cs: c.cs}); });   // merkezin bütün yarıçapları gidiyorsa satırı da gider
    atla += satirlariSil("c-center", h, kalan, yaricapKirp);
    CIRCLES = kalan; circleList();
  }
  const mn = new Set(by("olcumNokta")), mh = new Set(by("olcumHat"));
  if (mn.size || mh.size){
    MEASURE.forEach(ch => { if (!mh.has(ch) && ch.pts.some(p => mn.has(p))) ch.pts = ch.pts.filter(p => !mn.has(p)); });
    MEASURE = MEASURE.filter(ch => !mh.has(ch));
    if (!MEASURE.length) MEASURE = [{color: M_COLORS[0], pts: []}];
    $("m-color").value = MEASURE[MEASURE.length - 1].color;
    measureList();
  }
  const ns = new Set(by("not"));
  if (ns.size){
    const h = []; ns.forEach(n => { if (n.kaynak === "liste") n.pts.forEach(p => h.push({li: p.li, cs: p.cs})); });
    NOTLAR = NOTLAR.filter(n => !ns.has(n));
    atla += satirlariSil("n-liste", h, NOTLAR.filter(n => n.kaynak === "liste").flatMap(n => n.pts));
    notListe();
  }
  const rs = new Set(by("egri"));
  if (rs.size){ RINGS = RINGS.filter(r => !rs.has(r)); ringList(); }
  const n = ds.length;
  SEC.clear(); secimYenile(); draw(); degisti();
  toast(n.toLocaleString("tr-TR") + " öğe silindi · Ctrl+Z geri alır" + (atla ? " · " + atla + " satır listede bulunamadı (elle değiştirilmiş)" : ""), !!atla);
}

/* ---- fare ve klavye ---- */
SEC = new Map();
cv.addEventListener("click", e => {
  if (e.button !== 0 || moved || !secimAcik()) return;
  const d = secimBul(e.offsetX, e.offsetY);
  const ekle = e.ctrlKey || e.metaKey || e.shiftKey;
  if (d){ secimTikla([d], e, false); const t = d.tur === "nokta" ? POINTS.indexOf(d.o) : -1; if (t >= 0 && SEC.has(d.key)) noktaListedeGoster(t); }
  else if (!ekle && SEC.size){ SEC.clear(); secimYenile(); draw(); }
});
/* haritadan seçilen nokta listede görünür kalsın */
function noktaListedeGoster(i){
  if (!$("pane-points").classList.contains("active")) return;
  const host = $("p-list"), k = PL.idx ? PL.idx.indexOf(i) : i;
  if (k < 0) return;
  const y = k * NOKTA_SATIR;
  if (y < host.scrollTop || y + NOKTA_SATIR > host.scrollTop + host.clientHeight) host.scrollTop = Math.max(0, y - host.clientHeight / 2);
}
cv.addEventListener("mousedown", e => {
  if (e.button !== 0 || !e.shiftKey || !secimAcik()) return;
  dragging = false; if (typeof SURUK !== "undefined") SURUK = null;     // harita kaymasın, tutamaç sürüklenmesin
  KUTU = {x0: e.offsetX, y0: e.offsetY, x1: e.offsetX, y1: e.offsetY, basladi: false};
});
cv.addEventListener("mousemove", e => {
  if (!KUTU) return;
  KUTU.x1 = e.offsetX; KUTU.y1 = e.offsetY;
  if (!KUTU.basladi && Math.hypot(KUTU.x1 - KUTU.x0, KUTU.y1 - KUTU.y0) > 4){ KUTU.basladi = true; moved = true; }
  if (KUTU.basladi) scheduleDraw();
});
window.addEventListener("mouseup", e => {
  if (!KUTU) return;
  const k = KUTU; KUTU = null;
  if (k.basladi){ moved = true; secimKutu(k, e.ctrlKey || e.metaKey); } else scheduleDraw();
});

function metinKutusunda(){
  const a = document.activeElement;
  return !!(a && ((/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !/^(checkbox|range|color|radio|button)$/.test(a.type)) || a.isContentEditable));
}
document.addEventListener("keydown", e => {
  if (document.querySelector(".modal:not([hidden])") || !$("ask").hidden) return;
  if (e.key === "Delete" && SEC.size && !metinKutusunda() && !PICK && !(typeof NOT_CIZGI !== "undefined" && NOT_CIZGI.length)){
    e.preventDefault(); e.stopPropagation(); secimSil(); return;
  }
  if (e.key === "Escape" && SEC.size && !MEASURE_ACTIVE && !NOT_OK_BAS && !NOT_CIZGI.length && !PICK && !MENU_ACIK){
    e.stopPropagation(); SEC.clear(); secimYenile(); draw(); return;
  }
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key || "").toLowerCase() === "a" && secimAcik() && !metinKutusunda()){
    e.preventDefault();
    SEC.clear(); secimTopla(() => true, true).forEach(d => SEC.set(d.key, d));
    secimYenile(); draw();
  }
}, true);
$("secim-sil").onclick = secimSil;
$("secim-kaldir").onclick = () => { SEC.clear(); secimYenile(); draw(); };
/* sekme değişince: ölçüm/not/seçim modu çakışmasın; çubuk yalnız seçim kipinde görünsün */
document.querySelectorAll(".tab[data-pane]").forEach(t => t.addEventListener("click", () => setTimeout(secimYenile, 0)));
/* proje yükleme, temizleme, yeni: seçim sıfırlanır */
const katmanlariTemizleSecimsiz = katmanlariTemizle;
katmanlariTemizle = function(){ katmanlariTemizleSecimsiz(); SEC.clear(); secimYenile(); };
