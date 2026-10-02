/* ============ uygulama: proje dosyası, masaüstü köprüsü, kısayollar ============ */
const APP_VER = "/*__VER__*/";
const MASAUSTU = window.masaustu || null;          // exe sürümünde shim.js sağlar
document.body.classList.toggle("desktop", !!MASAUSTU);
$("ver-line").textContent = "Sürüm " + APP_VER + (MASAUSTU ? ", masaüstü" : ", tarayıcı");
document.querySelectorAll(".desk-only").forEach(e => { if (!MASAUSTU) e.remove(); });

/* ---- bildirim ---- */
let toastT = 0;
function toast(msg, warn){
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("warn", !!warn);
  t.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("on"), 2600);
}

/* ---- yardım penceresi ---- */
let lastFocus = null;
function helpOpen(){
  lastFocus = document.activeElement;
  $("modal").hidden = false;
  $("modal-x").focus();
}
function helpClose(){
  $("modal").hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$("btn-help").onclick = helpOpen;
$("modal-x").onclick = helpClose;
$("modal").addEventListener("mousedown", e => { if (e.target === $("modal")) helpClose(); });

/* ---- sekme geçişi ---- */
const PANES = ["pane-areas","pane-circles","pane-rings","pane-points","pane-measure","pane-view","pane-export"];
function sekmeAc(id){ const t = document.querySelector('.tab[data-pane="' + id + '"]'); if (t) t.click(); }

/* ---- proje durumu ---- */
let KIRLI = false, YUKLENIYOR = false;
let DOSYA = {ad: null, yol: null};

function baslikYaz(){
  const ad = DOSYA.ad || "Adsız pafta";
  document.title = (KIRLI ? "● " : "") + ad + " — PAFTA";
  $("file-name").textContent = ad;
  $("file-line").classList.toggle("dirty", KIRLI);
  if (MASAUSTU) MASAUSTU.kirli(KIRLI);
}
function setKirli(d){ KIRLI = d; baslikYaz(); }
function degisti(){ if (!YUKLENIYOR && !KIRLI) setKirli(true); }
function setDosya(ad, yol){ DOSYA = {ad: ad || null, yol: yol || null}; baslikYaz(); }

/* panelde yapılan her değişiklik projeyi kirletir; dışa aktarım düğmeleri hariç */
const PANEL = document.querySelector(".panel");
PANEL.addEventListener("input", e => { if (e.target.id !== "proj-file") degisti(); });
PANEL.addEventListener("change", e => { if (e.target.id !== "proj-file") degisti(); });
PANEL.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b || !b.isConnected || b.closest("#pane-export") || b.id === "btn-file" || b.classList.contains("pick")) return;
  degisti();
});

function formKontrolleri(){
  return [...PANEL.querySelectorAll("input[id], select[id], textarea[id]")].filter(e => e.type !== "file");
}
const FORM0 = {};
formKontrolleri().forEach(e => FORM0[e.id] = e.type === "checkbox" ? e.checked : e.value);

function projeTopla(){
  const form = {};
  formKontrolleri().forEach(e => form[e.id] = e.type === "checkbox" ? e.checked : e.value);
  const b = viewBounds();
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const daireRenk = {};
  CIRCLES.forEach(c => daireRenk[c.label] = c.color);
  return {
    uygulama: "PAFTA", surum: 1, kayit: new Date().toISOString(),
    form,
    alanlar: ZONES.length ? ZONES.map(z => ({ad: z.name, renk: z.color, gorunur: z.visible})) : null,
    daireler: CIRCLES.length ? daireRenk : null,
    mesafe: RINGS.length ? RINGS.map(r => r.color) : null,
    noktalar: POINTS.map(p => ({ad: p.name, enlem: r6(p.lat), boylam: r6(p.lon), renk: p.color})),
    olcum: MEASURE.filter(ch => ch.pts.length).map(ch => ({renk: ch.color,
      noktalar: ch.pts.map(p => ({enlem: r6(p.lat), boylam: r6(p.lon), ad: p.name || null}))})),
    gorunum: {projeksiyon: view.mode, latMin: r6(b.latMin), lonMin: r6(b.lonMin), latMax: r6(b.latMax), lonMax: r6(b.lonMax)}
  };
}

function katmanlariTemizle(){
  pickBitir();
  ZONES = []; CIRCLES = []; RINGS = []; RING_SRC = null; RING_REF = null; POINTS = [];
  MEASURE = [{color: M_COLORS[0], pts: []}];
  renderZoneList(); circleList(); ringList(); pointList(); measureList();
  ["msg","c-msg","r-msg","p-msg"].forEach(id => $(id).textContent = "");
}
function bagliAlanlariGuncelle(){
  $("r-mv-box").hidden = !$("r-mv").checked;
  $("r-mv-src").dispatchEvent(new Event("change"));
  $("sat-box").hidden = !$("opt-sat").checked;
  view.mode = $("opt-proj").value;
}

function projeYukle(o){
  YUKLENIYOR = true; SUPPRESS_FIT = true;
  try {
    katmanlariTemizle();
    formKontrolleri().forEach(e => {
      const v = (o.form && e.id in o.form) ? o.form[e.id] : FORM0[e.id];
      if (e.type === "checkbox") e.checked = !!v; else e.value = v == null ? "" : v;
    });
    bagliAlanlariGuncelle();
    if (o.alanlar){
      build();
      o.alanlar.forEach((z, i) => { if (ZONES[i]){ if (z.renk) ZONES[i].color = z.renk; ZONES[i].visible = z.gorunur !== false; } });
      renderZoneList();
    }
    if (o.daireler){
      buildCircles();
      CIRCLES.forEach(c => { if (o.daireler[c.label]) c.color = o.daireler[c.label]; });
      circleList();
    }
    if (o.mesafe){
      buildRings(true);
      RINGS.forEach((r, i) => { if (o.mesafe[i]) r.color = o.mesafe[i]; });
      ringList();
    }
    POINTS = (o.noktalar || []).filter(p => isFinite(p.enlem) && isFinite(p.boylam))
      .map(p => ({name: p.ad || "Nokta", lat: +p.enlem, lon: +p.boylam, color: p.renk || $("p-color").value}));
    pointList();
    const hat = (o.olcum || []).map(ch => ({color: ch.renk || M_COLORS[0],
      pts: (ch.noktalar || []).filter(p => isFinite(p.enlem) && isFinite(p.boylam)).map(p => ({lat: +p.enlem, lon: +p.boylam, name: p.ad || null}))}))
      .filter(ch => ch.pts.length);
    MEASURE = hat.length ? hat : [{color: M_COLORS[0], pts: []}];
    $("m-color").value = MEASURE[MEASURE.length - 1].color;
    measureList();
    const dolu = ZONES.length || CIRCLES.length || RINGS.length || POINTS.length || hat.length;
    $("stage-empty").style.display = dolu ? "none" : "";
  } finally {
    YUKLENIYOR = false; SUPPRESS_FIT = false;
  }
  const g = o.gorunum;
  if (g && isFinite(g.latMin)) fitBounds(g.latMin, g.lonMin, g.latMax, g.lonMax, 0, true);
  else fitAll(true);
}

function projeMetniYukle(txt, ad, yol){
  let o = null;
  try { o = JSON.parse(txt); } catch(e){}
  if (!o || o.uygulama !== "PAFTA"){
    uyar((ad ? ad + " " : "Bu dosya ") + "bir PAFTA projesi değil.", "Proje dosyaları .pafta uzantılıdır ve PAFTA ile kaydedilir.");
    return false;
  }
  projeYukle(o);
  const k = o._dosya || {};
  setDosya(ad || k.ad, yol || k.yol);
  setKirli(false);
  return true;
}

/* ---- sorular: uygulamanın kendi penceresi; ilk düğme varsayılan, Esc son düğme ---- */
let askAcik = null;
function sor({mesaj, detay, dugmeler, tur}){
  dugmeler = dugmeler && dugmeler.length ? dugmeler : ["Tamam"];
  if (askAcik) askAcik(dugmeler.length - 1);
  return new Promise(coz => {
    const card = document.querySelector(".ask-card"), host = $("ask-btns");
    card.className = "ask-card " + (tur || "");
    $("ask-title").textContent = mesaj || "";
    $("ask-text").textContent = detay || "";
    host.innerHTML = "";
    const odak = document.activeElement;
    const bitir = i => {
      $("ask").hidden = true; askAcik = null;
      document.removeEventListener("keydown", tus, true);
      if (odak && odak.focus) odak.focus();
      coz(i);
    };
    const tus = e => {
      if (e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); bitir(dugmeler.length - 1); }
      else if (e.key === "Tab"){
        const bs = [...host.querySelectorAll("button")], i = bs.indexOf(document.activeElement);
        e.preventDefault(); bs[(i + (e.shiftKey ? bs.length - 1 : 1)) % bs.length].focus();
      } else if (!["Enter"," "].includes(e.key)) e.stopPropagation();
    };
    // görsel sıra: vazgeçme solda, birincil işlem sağda
    dugmeler.map((d, i) => [d, i]).reverse().forEach(([d, i]) => {
      const b = document.createElement("button");
      b.textContent = d;
      if (i === 0) b.className = "primary";
      b.onclick = () => bitir(i);
      host.appendChild(b);
    });
    askAcik = bitir;
    $("ask").hidden = false;
    document.addEventListener("keydown", tus, true);
    host.lastChild.focus();
  });
}
function uyar(mesaj, detay){ return sor({mesaj, detay, dugmeler: ["Tamam"], tur: "warning"}); }
async function kaydedilmemisSor(){
  if (!KIRLI) return true;
  const r = await sor({mesaj: "Bu paftada kaydedilmemiş değişiklikler var.",
                       detay: (DOSYA.ad ? DOSYA.ad + " dosyasındaki" : "Yaptığınız") + " değişiklikler kaydedilmezse kaybolur.",
                       dugmeler: ["Kaydet", "Kaydetmeden devam et", "Vazgeç"], tur: "warning"});
  if (r === 0) return await kaydet(false);
  return r === 1;
}

/* ---- kaydet / aç / yeni ---- */
async function kaydet(farkli){
  const o = projeTopla();
  const json = JSON.stringify(o, null, 1);
  const varsayilan = DOSYA.ad || (dosyaKoku() + ".pafta");
  if (MASAUSTU){
    let yol = DOSYA.yol;
    if (farkli || !yol){
      yol = await MASAUSTU.kaydetYeri({ad: varsayilan, uzanti: "pafta", baslik: farkli ? "Farklı kaydet" : "Kaydet"});
      if (!yol) return false;
    }
    const r = await MASAUSTU.yaz(yol, json, true);
    if (!r || !r.ok) return false;
    setDosya(r.ad, yol); setKirli(false);
    MASAUSTU.kurtarmaSil();
    toast("Kaydedildi: " + r.ad);
    sonAcilanlar();
    return true;
  }
  download(varsayilan, new Blob([json], {type: "application/json"}));
  setDosya(varsayilan, null); setKirli(false);
  return true;
}
async function ac(yol){
  if (!(await kaydedilmemisSor())) return;
  if (MASAUSTU){
    const r = await MASAUSTU.ac(yol);
    if (r && projeMetniYukle(r.icerik, r.ad, r.yol)) toast("Açıldı: " + r.ad);
    sonAcilanlar();
    return;
  }
  $("proj-file").value = "";
  $("proj-file").click();
}
$("proj-file").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then(t => { if (projeMetniYukle(t, f.name, null)) toast("Açıldı: " + f.name); });
});
async function yeni(){
  if (!(await kaydedilmemisSor())) return;
  YUKLENIYOR = true;
  katmanlariTemizle();
  formKontrolleri().forEach(e => { if (e.type === "checkbox") e.checked = FORM0[e.id]; else e.value = FORM0[e.id]; });
  bagliAlanlariGuncelle();
  YUKLENIYOR = false;
  $("stage-empty").style.display = "";
  setDosya(null, null); setKirli(false);
  if (MASAUSTU) MASAUSTU.kurtarmaSil();
  fitWorld();
}
$("btn-proj-save").onclick = () => kaydet(false);
$("btn-proj-saveas").onclick = () => kaydet(true);
$("btn-proj-open").onclick = () => ac();
$("btn-proj-new").onclick = () => yeni();

/* ---- masaüstü: son açılanlar ---- */
async function sonAcilanlar(){
  if (!MASAUSTU) return;
  const l = (await MASAUSTU.sonAcilanlar()) || [];
  const ul = $("recent-list");
  ul.innerHTML = "";
  l.forEach(f => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.innerHTML = esc(f.ad) + "<small>" + esc(f.klasor) + "</small>";
    b.title = f.yol;
    b.onclick = () => ac(f.yol);
    li.appendChild(b); ul.appendChild(li);
  });
  $("recent").hidden = false;
  $("btn-recent-clear").hidden = !l.length;
  if (!l.length) ul.innerHTML = '<li><small style="font-family:var(--prose)">Henüz kaydedilmiş ya da açılmış bir pafta yok.</small></li>';
}
if (MASAUSTU){
  $("btn-proj-where").onclick = () => { if (DOSYA.yol) MASAUSTU.konumuAc(DOSYA.yol); else toast("Bu pafta henüz bir dosyaya kaydedilmedi.", true); };
  $("btn-recent-clear").onclick = async () => { await MASAUSTU.sonTemizle(); sonAcilanlar(); };
  MASAUSTU.veriKlasoru().then(d => { $("data-dir").textContent = "Ayarlar ve kurtarma kaydı: " + d; });
}
if (!MASAUSTU) $("btn-proj-saveas").remove();          // tarayıcıda her kayıt bir indirmedir

/* ---- klavye ---- */
document.addEventListener("keydown", e => {
  const k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (!$("ask").hidden) return;
  if (!$("modal").hidden){
    if (k === "escape" || k === "f1"){ e.preventDefault(); e.stopPropagation(); helpClose(); }
    return;
  }
  if (k === "f1"){ e.preventDefault(); helpOpen(); return; }
  if (!mod || e.altKey) return;
  if (k === "s"){ e.preventDefault(); kaydet(e.shiftKey); return; }
  if (e.shiftKey && k !== "+") return;
  const map = {
    o: () => ac(), e: () => $("btn-png").click(), u: toggleSat, "0": () => fitAll(),
    "+": () => zoomBy(1.5), "=": () => zoomBy(1.5), "-": () => zoomBy(1/1.5)
  };
  if (MASAUSTU) map.n = () => yeni();
  if (/^[1-7]$/.test(k)) map[k] = () => sekmeAc(PANES[+k - 1]);
  if (map[k]){ e.preventDefault(); e.stopPropagation(); map[k](); }
}, true);

/* ---- sürükle-bırak: .pafta açar, koordinat listesi açık araca yüklenir ---- */
const STAGE = document.querySelector(".stage");
let dropDepth = 0;
const hasFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
document.addEventListener("dragenter", e => { if (hasFiles(e)){ dropDepth++; STAGE.classList.add("drop"); } });
document.addEventListener("dragleave", e => { if (hasFiles(e) && --dropDepth <= 0){ dropDepth = 0; STAGE.classList.remove("drop"); } });
document.addEventListener("dragover", e => { if (hasFiles(e)) e.preventDefault(); });
document.addEventListener("drop", async e => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dropDepth = 0; STAGE.classList.remove("drop");
  const f = e.dataTransfer.files[0];
  if (!f) return;
  const txt = await f.text();
  if (/\.pafta$/i.test(f.name) || /^\s*\{/.test(txt)){
    if (await kaydedilmemisSor() && projeMetniYukle(txt, f.name, null)) toast("Açıldı: " + f.name);
    return;
  }
  const aktif = (document.querySelector(".pane.active") || {}).id;
  const hedef = {
    "pane-points":  ["p-input", buildPoints],
    "pane-circles": ["c-center", buildCircles],
    "pane-rings":   $("r-mv").checked && $("r-mv-src").value === "own" ? ["r-mv-text", () => buildRings()] : null
  }[aktif] || ["input", build];
  if (hedef[0] === "input") sekmeAc("pane-areas");
  $(hedef[0]).value = txt;
  hedef[1]();
  degisti();
  toast(f.name + " yüklendi");
});

/* ---- tarayıcı: kaydedilmemiş değişiklikle kapatma uyarısı ---- */
if (!MASAUSTU) window.addEventListener("beforeunload", e => { if (KIRLI){ e.preventDefault(); e.returnValue = ""; } });

/* ---- masaüstü: menü, başlangıç dosyası, kurtarma kaydı ---- */
if (MASAUSTU){
  MASAUSTU.bildirim(m => toast(m));
  MASAUSTU.menu(k => {
    const ex = {png: "btn-png", kml: "btn-kml", geojson: "btn-geojson", csv: "btn-csv"};
    if (k === "yeni") yeni();
    else if (k === "ac") ac();
    else if (k.startsWith("ac:")) ac(k.slice(3));
    else if (k === "kaydet") kaydet(false);
    else if (k === "farkli") kaydet(true);
    else if (ex[k]) $(ex[k]).click();
    else if (k.startsWith("sekme:")) sekmeAc(k.slice(6));
    else if (k === "sigdir") fitAll();
    else if (k === "dunya") fitWorld();
    else if (k === "uydu") toggleSat();
    else if (k === "yakin") zoomBy(1.5);
    else if (k === "uzak") zoomBy(1/1.5);
    else if (k === "yardim") helpOpen();
    else if (k === "konum"){ if (DOSYA.yol) MASAUSTU.konumuAc(DOSYA.yol); else toast("Bu pafta henüz bir dosyaya kaydedilmedi.", true); }
    else if (k === "kapatma-istegi") kaydedilmemisSor().then(ok => { if (ok) MASAUSTU.kapat(); });
  });
  sonAcilanlar();
  setInterval(() => {
    if (!KIRLI) return;
    const o = projeTopla(); o._dosya = DOSYA;
    MASAUSTU.kurtarmaYaz(JSON.stringify(o));
  }, 15000);
  (async () => {
    const r = await MASAUSTU.baslangic();
    if (r && r.icerik){ projeMetniYukle(r.icerik, r.ad, r.yol); sonAcilanlar(); return; }
    const k = await MASAUSTU.kurtarmaOku();
    if (!k) return;
    const c = await sor({mesaj: "Önceki oturumdan kaydedilmemiş bir pafta bulundu.",
                         detay: "Uygulama beklenmedik şekilde kapanmış olabilir. Son kurtarma kaydı geri yüklensin mi?",
                         dugmeler: ["Geri yükle", "Sil"]});
    if (c === 0 && projeMetniYukle(k, null, null)){ setKirli(true); toast("Kaydedilmemiş pafta geri yüklendi"); }
    else MASAUSTU.kurtarmaSil();
  })();
}

/* ============ haritadan konum seçici ============ */
/* Renk seçicideki damlalık gibi: düğmeye basılır, haritaya tıklanan her yerin koordinatı ilgili listeye eklenir.
   Tıklama noktalara, alan köşelerine ve daire merkezlerine 10 piksel içinde yapışır. Esc ya da "Bitti" ile biter. */
var PICK = null;                          // {hedef, btn}; var: draw() uygulama kodundan önce de çağrılır
const PICK_HEDEF = {
  "input": {
    ad: "alan köşesi",
    satir(ta, enlem, boylam){
      const metin = ta.value;
      if (!metin.trim()) return "Yeni alan\t1\t" + enlem + "\t" + boylam;
      if (/\n\s*\n\s*$/.test(metin)) return "\t1\t" + enlem + "\t" + boylam;           // boş satır: yeni alan
      const z = parseText(metin).zones, son = z[z.length - 1];
      return "\t" + ((son ? son.points.length : 0) + 1) + "\t" + enlem + "\t" + boylam;
    },
    ciz: () => build(),
    ipucu: "Boş satır yeni alan başlatır."
  },
  "c-center": {
    ad: "daire merkezi",
    satir(ta, enlem, boylam){ return "Merkez " + (ta.value.split("\n").filter(l => l.trim()).length + 1) + "\t" + enlem + "\t" + boylam; },
    ciz: () => buildCircles()
  },
  "p-input": {
    ad: "nokta",
    satir(ta, enlem, boylam){ return "Nokta " + (ta.value.split("\n").filter(l => l.trim()).length + 1) + "\t" + enlem + "\t" + boylam; },
    ciz: () => buildPoints()
  },
  "r-mv-text": {
    ad: "Mavi Vatan köşesi",
    satir(ta, enlem, boylam){ return (ta.value.split("\n").filter(l => l.trim()).length + 1) + "\t" + enlem + "\t" + boylam; },
    ciz: null                                                                          // eğriler "Eğrileri çiz" ile
  }
};

function pickBaslat(btn){
  const hedef = btn.dataset.hedef;
  if (PICK && PICK.hedef === hedef){ pickBitir(); return; }
  pickBitir();
  PICK = {hedef, btn};
  btn.setAttribute("aria-pressed", "true");
  const h = PICK_HEDEF[hedef];
  $("pick-text").textContent = "Tıklanan yer " + h.ad + " olarak eklenir." + (h.ipucu ? " " + h.ipucu : "");
  $("pick-banner").classList.add("on");
  cv.classList.add("measure");
  hideEmpty();
}
function pickBitir(){
  if (!PICK) return;
  PICK.btn.setAttribute("aria-pressed", "false");
  PICK = null;
  $("pick-banner").classList.remove("on");
  cv.classList.toggle("measure", MEASURE_ACTIVE);
  if (!MEASURE_ACTIVE) HOVER = null;
  draw();
}
function pickTikla(e){
  const sn = snapAt(e.offsetX, e.offsetY);
  const lat = sn ? sn.lat : latAt(e.offsetY), lon = sn ? sn.lon : lonAt(e.offsetX);
  if (Math.abs(lat) > 85) return;
  const h = PICK_HEDEF[PICK.hedef], ta = $(PICK.hedef);
  const satir = h.satir(ta, dms(lat, true), dms(lon, false));
  ta.value = ta.value.replace(/[ \t]+$/, "") + (ta.value && !ta.value.endsWith("\n") ? "\n" : "") + satir;
  ta.scrollTop = ta.scrollHeight;
  ta.dispatchEvent(new Event("input", {bubbles: true}));               // proje kirlenir
  if (h.ciz){ SUPPRESS_FIT = true; try { h.ciz(); } finally { SUPPRESS_FIT = false; } }
  draw();
  toast(dms(lat, true) + "  " + dms(lon, false) + (sn && sn.name ? "  (" + sn.name + ")" : "") + " eklendi");
}
function drawPick(){
  if (!PICK || !HOVER) return;
  const X = HOVER.x, Y = HOVER.y;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(14,26,33,.55)"; ctx.lineWidth = 3.4;
  const artı = () => { ctx.beginPath(); ctx.arc(X, Y, 8, 0, 6.284);
    ctx.moveTo(X - 15, Y); ctx.lineTo(X - 5, Y); ctx.moveTo(X + 5, Y); ctx.lineTo(X + 15, Y);
    ctx.moveTo(X, Y - 15); ctx.lineTo(X, Y - 5); ctx.moveTo(X, Y + 5); ctx.lineTo(X, Y + 15); ctx.stroke(); };
  artı();
  ctx.strokeStyle = "#f2a93b"; ctx.lineWidth = 1.7; artı();
  const t = dms(HOVER.lat, true) + "  " + dms(HOVER.lon, false) + (HOVER.name ? "  ·  " + HOVER.name : "");
  ctx.font = "600 12px " + FONT();
  const w = ctx.measureText(t).width + 14;
  let bx = X + 18, by = Y + 14;
  if (bx + w > W - 16) bx = X - 18 - w;
  if (by + 22 > H - 16) by = Y - 36;
  ctx.fillStyle = "rgba(14,26,33,.9)"; ctx.fillRect(bx, by, w, 22);
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(t, bx + 7, by + 11.5);
  ctx.restore();
}
document.querySelectorAll("button.pick").forEach(b => b.onclick = () => pickBaslat(b));
$("pick-done").onclick = pickBitir;
document.addEventListener("keydown", e => {
  if (PICK && e.key === "Escape" && $("ask").hidden && $("modal").hidden){ e.preventDefault(); e.stopPropagation(); pickBitir(); }
}, true);

baslikYaz();

/* ---- açılış ekranı: ilk çizimden sonra, en az kısa bir an görünür kalıp çekilir ---- */
(() => {
  const sp = $("splash");
  const kalan = Math.max(0, 650 - performance.now());
  requestAnimationFrame(() => setTimeout(() => {
    sp.classList.add("gone");
    setTimeout(() => sp.remove(), 600);
  }, REDUCED_MOTION ? 0 : kalan));
})();
