/* ============ dosyadan al: metin, CSV ya da Excel (.xlsx; sütun eşleştirmeli) ============ */
const XL_HEDEF = {
  alan:  {ta: "input",    ciz: () => build(),         pane: "pane-areas",   ad: "Alanlar"},
  nokta: {ta: "p-input",  ciz: () => buildPoints(),   pane: "pane-points",  ad: "Noktalar"},
  daire: {ta: "c-center", ciz: () => buildCircles(),  pane: "pane-circles", ad: "Daireler"}
};
const XL_ROLLER = [
  {id: "ad",    ad: "Ad",           hedef: ["alan", "nokta", "daire"], re: /^(ad|adı|isim|name|bölge|bolge|alan|saha|nokta adı|merkez|title)$/i},
  {id: "no",    ad: "Nokta no",     hedef: ["alan"],                   re: /^(no|nr|nokta|sıra|sira|köşe|kose|#|point)$/i},
  {id: "enlem", ad: "Enlem",        hedef: ["alan", "nokta", "daire"], re: /^(enlem|lat|latitude|kuzey|koordinat|koord|konum|mgrs|utm|coordinate)|^[ny]$/i},
  {id: "boylam",ad: "Boylam",       hedef: ["alan", "nokta", "daire"], re: /^(boylam|lon|lng|long|longitude|doğu|dogu)|^[ex]$/i},
  {id: "r",     ad: "Yarıçap",      hedef: ["daire"],                  re: /^(yarıçap|yaricap|radius|mesafe)|^r$/i},
  {id: "renk",  ad: "Renk",         hedef: ["nokta"],                  re: /^(renk|color|colour)$/i}
];

let XL = null;            // {ad, sayfalar, hedef}
function hucreMetin(v, koord){
  if (v == null) return "";
  if (typeof v === "number") return koord && Number.isInteger(v) ? v.toFixed(1) : String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return String(v).replace(/[\t\r\n]+/g, " ").trim();
}
function xlSayfa(){ return XL.sayfalar[+$("xl-sayfa").value || 0]; }
function xlSutunSayisi(s){ return s.satirlar.reduce((m, r) => Math.max(m, r.length), 0); }
const harfAdi = j => { let s = ""; j++; while (j){ const m = (j - 1) % 26; s = String.fromCharCode(65 + m) + s; j = (j - m - 1) / 26; } return s; };

/* başlık satırı var mı ve sütunların rolü: önce başlık adları, sonra hücre içerikleri */
function xlTahmin(){
  const s = xlSayfa(), n = xlSutunSayisi(s), ilk = s.satirlar.find(r => r.some(v => v !== "" && v != null)) || [];
  const ilkKoord = ilk.some((v, j) => koordBul(hucreMetin(v, true) + "\t" + hucreMetin(ilk[j + 1], true)));
  const baslik = !ilkKoord && ilk.some(v => typeof v === "string" && v.trim());
  $("xl-baslik").checked = baslik;
  const rol = {};
  if (baslik) ilk.forEach((v, j) => {
    const t = String(v || "").trim().replace(/[\s:.]+$/, "");
    XL_ROLLER.forEach(r => { if (rol[r.id] == null && r.re.test(t) && !Object.values(rol).includes(j)) rol[r.id] = j; });
  });
  if (rol.enlem == null){                                          // içerikten: koordinat sütunları
    const veri = s.satirlar.slice(baslik ? 1 : 0, 40);
    const tur = j => {
      let lat = 0, lon = 0, cift = 0, sayi = 0;
      veri.forEach(r => {
        const t = hucreMetin(r[j], true); if (!t) return;
        const k = koordBul(t); if (k && !k.hata){ cift++; return; }
        const h = scanCoords(t);
        if (h.length === 1){ if (h[0].hemi) h[0].hemi.axis === "lat" ? lat++ : lon++; else if (isFinite(h[0].value) && /^[+-]?\d+([.,]\d+)?$/.test(t)) sayi++; }
      });
      return {lat, lon, cift, sayi};
    };
    const T = [...Array(n)].map((_, j) => tur(j));
    const c = T.findIndex(t => t.cift > 0 && t.cift >= t.lat + t.lon + t.sayi);
    if (c >= 0){ rol.enlem = c; rol.boylam = -1; }
    else {
      const la = T.findIndex(t => t.lat > 0), lo = T.findIndex(t => t.lon > 0);
      if (la >= 0 && lo >= 0){ rol.enlem = la; rol.boylam = lo; }
      else {
        const sayilar = T.map((t, j) => [t.sayi, j]).filter(x => x[0] > 0 && x[1] !== rol.no);
        if (sayilar.length >= 2){ rol.enlem = sayilar[sayilar.length - 2][1]; rol.boylam = sayilar[sayilar.length - 1][1]; }
      }
    }
  }
  if (rol.ad == null){                                            // ilk metin sütunu ad olsun
    const veri = s.satirlar.slice(baslik ? 1 : 0, 40);
    for (let j = 0; j < n; j++){
      if (Object.values(rol).includes(j)) continue;
      if (veri.some(r => typeof r[j] === "string" && r[j].trim() && !koordBul(r[j]) && !scanCoords(r[j]).length)){ rol.ad = j; break; }
    }
  }
  XL_ROLLER.forEach(r => { $("xl-" + r.id).value = rol[r.id] == null ? "-1" : String(rol[r.id]); });
}

function xlSecenekler(){
  const s = xlSayfa(), n = xlSutunSayisi(s), baslik = $("xl-baslik").checked;
  const ilk = baslik ? (s.satirlar.find(r => r.length) || []) : [];
  XL_ROLLER.forEach(r => {
    const sel = $("xl-" + r.id), eski = sel.value;
    sel.innerHTML = '<option value="-1">' + (r.id === "boylam" ? "— (enlem sütununda ikisi birlikte)" : "—") + "</option>" +
      [...Array(n)].map((_, j) => '<option value="' + j + '">' + harfAdi(j) + (ilk[j] != null && ilk[j] !== "" ? " · " + esc(String(ilk[j]).slice(0, 24)) : "") + "</option>").join("");
    sel.value = [...sel.options].some(o => o.value === eski) ? eski : "-1";
  });
  const h = $("xl-hedef").value;
  XL_ROLLER.forEach(r => { $("xl-" + r.id).closest("label").hidden = !r.hedef.includes(h); });
  $("xl-birim").closest("label").hidden = h !== "daire";
}

/* satırlar -> araç listesine yazılacak metin; her satır için okunan koordinat */
function xlSatirlar(){
  const s = xlSayfa(), h = $("xl-hedef").value, baslik = $("xl-baslik").checked;
  const col = id => +$("xl-" + id).value, birim = $("xl-birim").value;
  const c = {}; XL_ROLLER.forEach(r => c[r.id] = r.hedef.includes(h) ? col(r.id) : -1);
  const al = (r, j, k) => j >= 0 ? hucreMetin(r[j], k) : "";
  let basla = 0;
  if (baslik){ basla = s.satirlar.findIndex(r => r.length) + 1; }
  const out = [];
  let onceki = null, sayac = 0;
  s.satirlar.slice(basla).forEach((r, i) => {
    const bos = !r.some(v => v !== "" && v != null);
    if (bos){ out.push({satir: "", bos: true}); onceki = null; return; }
    const koord = al(r, c.enlem, true) + (c.boylam >= 0 ? "\t" + al(r, c.boylam, true) : "");
    const k = koord.trim() ? koordBul(koord) : null;
    const ok = k && !k.hata;
    let ad = al(r, c.ad), satir;
    sayac++;
    if (h === "alan"){
      const no = al(r, c.no);
      satir = (ad && ad !== onceki ? ad : "") + "\t" + no + "\t" + koord;
      if (ad) onceki = ad;
    } else if (h === "nokta"){
      const renk = al(r, c.renk);
      satir = (ad || "Nokta " + sayac) + "\t" + koord + (/^#?[0-9a-f]{6}$/i.test(renk) ? "\t" + (renk[0] === "#" ? renk : "#" + renk) : "");
    } else {
      let rv = al(r, c.r);
      if (rv && /^\d+([.,]\d+)?$/.test(rv)) rv += " " + (birim === "nm" ? "NM" : birim);
      satir = (ad || "Merkez " + sayac) + "\t" + koord + (rv ? "\t" + rv : "");
    }
    out.push({satir, ok, k, ham: r, no: basla + i + 1});
  });
  while (out.length && out[out.length - 1].bos) out.pop();
  return out;
}

function xlOnizle(){
  const s = xlSayfa(), n = Math.min(xlSutunSayisi(s), 12), satirlar = xlSatirlar();
  const rolSut = {}; XL_ROLLER.forEach(r => { const v = +$("xl-" + r.id).value; if (v >= 0 && !$("xl-" + r.id).closest("label").hidden) rolSut[v] = r.ad; });
  let html = "<table><tr><th></th>" + [...Array(n)].map((_, j) => "<th" + (rolSut[j] ? ' class="rol"' : "") + ">" + harfAdi(j) + (rolSut[j] ? "<small>" + rolSut[j] + "</small>" : "") + "</th>").join("") + "<th>Okunan</th></tr>";
  satirlar.filter(x => !x.bos).slice(0, 10).forEach(x => {
    html += "<tr><td class=\"no\">" + x.no + "</td>" + [...Array(n)].map((_, j) => "<td" + (rolSut[j] ? ' class="rol"' : "") + ">" + esc(hucreMetin(x.ham[j]).slice(0, 28)) + "</td>").join("") +
      "<td class=\"" + (x.ok ? "ok" : "hata") + "\">" + (x.ok ? esc(fk(x.k.lat, x.k.lon)) : "okunamadı") + "</td></tr>";
  });
  html += "</table>";
  $("xl-tablo").innerHTML = html;
  const dolu = satirlar.filter(x => !x.bos), iyi = dolu.filter(x => x.ok).length;
  $("xl-msg").innerHTML = !dolu.length ? '<span class="warn">Bu sayfada veri yok.</span>'
    : iyi ? '<span class="ok">' + iyi + " satırda koordinat okundu" + (dolu.length > iyi ? '</span>, <span class="warn">' + (dolu.length - iyi) + " satır okunamadı (atlanır)" : "") + ".</span>"
    : '<span class="warn">Koordinat okunamadı: enlem ve boylam sütunlarını seçin.</span>';
  $("xl-ekle").disabled = !iyi;
}

function xlEkle(){
  const h = $("xl-hedef").value, H = XL_HEDEF[h], ta = $(H.ta);
  const satirlar = xlSatirlar().filter(x => x.bos || x.ok).map(x => x.satir);
  const metin = satirlar.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if ($("xl-degistir").checked || !ta.value.trim()) ta.value = metin;
  else ta.value = ta.value.replace(/\s+$/, "") + "\n\n" + metin;
  ta.dispatchEvent(new Event("input", {bubbles: true}));
  $("xl").hidden = true;
  sekmeAc(H.pane);
  H.ciz();
  toast(XL.ad + ": " + satirlar.filter(Boolean).length + " satır " + H.ad.toLocaleLowerCase("tr-TR") + " listesine eklendi");
}

function excelAc(ab, ad, hedef){
  let sayfalar;
  try { sayfalar = xlsxOku(ab); }
  catch (e){ uyar(ad + " okunamadı.", (e && e.message) || "Dosya bozuk ya da desteklenmeyen bir biçimde."); return; }
  sayfalar = sayfalar.filter(s => s.satirlar.some(r => r.some(v => v !== "" && v != null)));
  if (!sayfalar.length){ uyar(ad + " içinde veri yok.", "Çalışma kitabındaki sayfalar boş görünüyor."); return; }
  XL = {ad, sayfalar};
  $("xl-dosya").textContent = ad;
  $("xl-sayfa").innerHTML = sayfalar.map((s, i) => '<option value="' + i + '">' + esc(s.ad) + " (" + s.satirlar.length + " satır)</option>").join("");
  $("xl-sayfa").closest("label").hidden = sayfalar.length < 2;
  $("xl-hedef").value = hedef || "alan";
  $("xl-degistir").checked = false;
  xlSecenekler(); xlTahmin(); xlSecenekler(); xlOnizle();
  $("xl").hidden = false;
}

/* ortak dosya yükleyici: .xlsx -> eşleştirme penceresi; .xls -> uyarı; diğerleri metin */
async function dosyaYukle(f, hedef){
  const H = XL_HEDEF[hedef] || XL_HEDEF.alan;
  if (/\.xlsx$|\.xlsm$/i.test(f.name)){ excelAc(await f.arrayBuffer(), f.name, hedef); return; }
  if (/\.xls$/i.test(f.name)){ uyar("Eski Excel biçimi (.xls) okunamıyor.", "Dosyayı Excel'de açıp \"Farklı kaydet\" ile .xlsx ya da CSV olarak kaydedin."); return; }
  const txt = await f.text();
  sekmeAc(H.pane);
  $(H.ta).value = txt;
  $(H.ta).dispatchEvent(new Event("input", {bubbles: true}));
  H.ciz();
  toast(f.name + " yüklendi");
}

$("file").setAttribute("accept", ".txt,.csv,.tsv,.xlsx,.xlsm,.xls");
$("file").onchange = e => { const f = e.target.files[0]; e.target.value = ""; if (f) dosyaYukle(f, $("file").dataset.hedef || "alan"); };
document.querySelectorAll("[data-dosya]").forEach(b => b.onclick = () => { $("file").dataset.hedef = b.dataset.dosya; $("file").click(); });
$("xl-sayfa").onchange = () => { xlSecenekler(); xlTahmin(); xlSecenekler(); xlOnizle(); };
$("xl-baslik").onchange = () => { xlSecenekler(); xlOnizle(); };
$("xl-hedef").onchange = () => { xlSecenekler(); xlOnizle(); };
XL_ROLLER.forEach(r => $("xl-" + r.id).onchange = xlOnizle);
$("xl-birim").onchange = xlOnizle;
$("xl-ekle").onclick = xlEkle;
[$("xl-x"), $("xl-iptal")].forEach(b => b.onclick = () => { $("xl").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("xl").hidden){ e.stopPropagation(); $("xl").hidden = true; } }, true);
