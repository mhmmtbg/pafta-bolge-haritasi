/* ============ lejant: hangi satırların görüneceği ============ */
/* Anahtarlar: a:alan adı, c:yarıçap etiketi, r:eğri etiketi, p:nokta rengi, m:ölçüm hattı no. Gizlenenler projeye kaydedilir. */
var LEJ_GIZLI = null;
function lejGizli(k){ return !!(LEJ_GIZLI && LEJ_GIZLI.has(k)); }

/* lejanda yer alabilecek bütün satırlar (gizliler dahil, sınırsız) */
function lejantAdaylari(){
  const l = [];
  if (opt("opt-layer-areas")) ZONES.forEach(z => { if (z.visible && !l.some(x => x.k === "a:" + z.name)) l.push({k: "a:" + z.name, renk: z.color, t: z.name, tur: "Alan"}); });
  if (opt("opt-layer-circles")){ const g = new Set(); CIRCLES.forEach(c => { if (!g.has(c.label)){ g.add(c.label); l.push({k: "c:" + c.label, renk: c.color, t: "Yarıçap " + c.label, tur: "Daire", yuv: 1}); } }); }
  if (opt("opt-layer-rings")) RINGS.forEach(lv => l.push({k: "r:" + lv.label, renk: lv.color, t: "Sınır mesafesi " + lv.label, tur: "Eğri"}));
  if (opt("opt-layer-points") && POINTS.length){
    const g = new Map();
    for (const p of POINTS){
      const x = g.get(p.color);
      if (!x){ g.set(p.color, {n: 1, kok: p.name.replace(/\s*#\d+$/, "")}); continue; }
      x.n++;
      if (x.kok && !(p.name === x.kok || p.name.startsWith(x.kok + " #"))) x.kok = "";
    }
    g.forEach((x, c) => l.push({k: "p:" + c, renk: c, t: (x.kok && (g.size > 1 || x.n > 1) ? x.kok : g.size === 1 ? "Noktalar" : "Nokta grubu " + c) + " (" + x.n.toLocaleString("tr-TR") + ")", tur: "Nokta", yuv: 1}));
  }
  if (opt("opt-layer-measure")) MEASURE.forEach((ch, i) => { if (ch.pts.length >= 2) l.push({k: "m:" + (i + 1), renk: ch.color, t: "Ölçüm hattı " + (i + 1), tur: "Ölçüm"}); });
  return l;
}
let LEJ_IMZA = "";
function lejantListe(zorla){
  const kutu = $("lej-secim");
  kutu.hidden = !opt("opt-legend");
  if (kutu.hidden || !$("pane-view").classList.contains("active")) return;
  const l = lejantAdaylari();
  const imza = l.map(x => x.k + "|" + x.renk + "|" + x.t).join("\n") + "#" + (LEJ_GIZLI ? [...LEJ_GIZLI].join("\n") : "");
  if (imza === LEJ_IMZA && !zorla) return;
  LEJ_IMZA = imza;
  const h = $("lej-liste");
  h.innerHTML = l.length ? "" : '<div class="lej-bas">Haritada lejanda gösterilecek öğe yok.</div>';
  l.forEach(x => {
    const lab = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = !lejGizli(x.k);
    cb.onchange = () => { if (cb.checked) LEJ_GIZLI.delete(x.k); else LEJ_GIZLI.add(x.k); LEJ_IMZA = ""; draw(); degisti(); };
    const i = document.createElement("i"); i.style.background = x.renk; if (x.yuv) i.className = "yuv";
    const sp = document.createElement("span"); sp.textContent = x.t; sp.title = x.t;
    const sm = document.createElement("small"); sm.textContent = x.tur;
    lab.append(cb, i, sp, sm);
    h.appendChild(lab);
  });
}
LEJ_GIZLI = new Set();
$("lej-tumu").onclick = () => { LEJ_GIZLI.clear(); lejantListe(true); draw(); degisti(); };
$("lej-hic").onclick = () => { lejantAdaylari().forEach(x => LEJ_GIZLI.add(x.k)); lejantListe(true); draw(); degisti(); };
$("opt-legend").addEventListener("change", () => lejantListe(true));
document.querySelectorAll(".tab[data-pane]").forEach(t => t.addEventListener("click", () => setTimeout(() => lejantListe(true), 0)));

/* proje dosyası */
const projeToplaLejantsiz = projeTopla;
projeTopla = function(){ const o = projeToplaLejantsiz(); if (LEJ_GIZLI.size) o.lejantGizli = [...LEJ_GIZLI]; return o; };
const projeYukleLejantsiz = projeYukle;
projeYukle = function(o){ const r = projeYukleLejantsiz(o); LEJ_GIZLI = new Set(Array.isArray(o && o.lejantGizli) ? o.lejantGizli : []); LEJ_IMZA = ""; draw(); return r; };
const katmanlariTemizleLejantsiz = katmanlariTemizle;
katmanlariTemizle = function(){ katmanlariTemizleLejantsiz(); LEJ_GIZLI = new Set(); LEJ_IMZA = ""; };
