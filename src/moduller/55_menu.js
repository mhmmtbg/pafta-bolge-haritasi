/* ============ Dosya menüsü ve tema ============ */
/* Araç çubuğundaki "Dosya" düğmesi (ve sol üstteki işaret) proje ve çıktı işlerini tek yerde toplar. */

function menuOgeleri(){
  const k = MASAUSTU ? {yeni: "Ctrl+N"} : {};
  const l = [
    {ad: "Yeni pafta", kisa: k.yeni || "", is: () => yeni()},
    {ad: "Aç…", kisa: "Ctrl+O", is: () => ac()},
    {alt: "son"},
    {ayrac: 1},
    {ad: "Kaydet", kisa: "Ctrl+S", is: () => kaydet(false)},
    {ad: "Farklı kaydet…", kisa: "Ctrl+Shift+S", is: () => kaydet(true), gizli: !MASAUSTU && !FS_API},
    {ayrac: 1},
    {ad: "PDF olarak kaydet…", ek: () => { const a = baskiAyar(); return a.ad + (a.olcek ? ", 1:" + a.olcek.toLocaleString("tr-TR") : ", ekrana sığdır"); }, is: () => pdfKaydet()},
    {ad: "PDF ayarları", is: () => { sekmeAc("pane-export"); $("pdf-kagit").scrollIntoView({block: "center"}); $("pdf-kagit").focus(); }},
    {ad: "Görüntü (PNG)", kisa: "Ctrl+E", is: () => $("btn-png").click()},
    {ad: "KML", is: () => $("btn-kml").click(), grup: "Veri"},
    {ad: "GeoJSON", is: () => $("btn-geojson").click(), grup: "Veri"},
    {ad: "CSV", is: () => $("btn-csv").click(), grup: "Veri"},
    {ayrac: 1},
    {ad: () => temaAcik() ? "Koyu tema" : "Açık tema", is: () => temaDegistir(!temaAcik())}
  ];
  return l.filter(o => !o.gizli);
}

let MENU_ACIK = false;
async function menuAc(){
  const m = $("dosya-menu");
  m.innerHTML = "";
  for (const o of menuOgeleri()){
    if (o.ayrac){ m.insertAdjacentHTML("beforeend", '<div class="menu-ayrac" role="separator"></div>'); continue; }
    if (o.alt === "son"){
      if (!MASAUSTU) continue;
      const l = (await MASAUSTU.sonAcilanlar()) || [];
      if (!l.length) continue;
      m.insertAdjacentHTML("beforeend", '<div class="menu-baslik">Son açılanlar</div>');
      l.slice(0, 6).forEach(f => {
        const b = document.createElement("button");
        b.setAttribute("role", "menuitem"); b.className = "son";
        b.innerHTML = "<span>" + esc(f.ad) + "</span><small>" + esc(f.klasor) + "</small>";
        b.title = f.yol;
        b.onclick = () => { menuKapat(); ac(f.yol); };
        m.appendChild(b);
      });
      continue;
    }
    if (o.grup && !m.querySelector('[data-grup="' + o.grup + '"]'))
      m.insertAdjacentHTML("beforeend", '<div class="menu-baslik" data-grup="' + o.grup + '">' + o.grup + "</div>");
    const b = document.createElement("button");
    b.setAttribute("role", "menuitem");
    const ad = typeof o.ad === "function" ? o.ad() : o.ad;
    b.innerHTML = "<span>" + esc(ad) + (o.ek ? "<small>" + esc(o.ek()) + "</small>" : "") + "</span>" + (o.kisa ? "<kbd>" + o.kisa + "</kbd>" : "");
    b.onclick = () => { menuKapat(); o.is(); };
    m.appendChild(b);
  }
  m.hidden = false; MENU_ACIK = true;
  $("btn-dosya").setAttribute("aria-expanded", "true");
  const ilk = m.querySelector("button"); if (ilk) ilk.focus();
}
function menuKapat(){
  if (!MENU_ACIK) return;
  $("dosya-menu").hidden = true; MENU_ACIK = false;
  $("btn-dosya").setAttribute("aria-expanded", "false");
}
$("btn-dosya").onclick = e => { e.stopPropagation(); MENU_ACIK ? menuKapat() : menuAc(); };
document.querySelector(".mark").addEventListener("click", e => { e.stopPropagation(); MENU_ACIK ? menuKapat() : menuAc(); });
document.addEventListener("mousedown", e => { if (MENU_ACIK && !e.target.closest("#dosya-menu, #btn-dosya, .mark")) menuKapat(); });
document.addEventListener("keydown", e => {
  if (!MENU_ACIK) return;
  const l = [...$("dosya-menu").querySelectorAll("button")], i = l.indexOf(document.activeElement);
  if (e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); menuKapat(); $("btn-dosya").focus(); }
  else if (e.key === "ArrowDown"){ e.preventDefault(); l[(i + 1) % l.length].focus(); }
  else if (e.key === "ArrowUp"){ e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
}, true);

/* ---- tema: arayüzün açık ya da koyu olması (harita aynı kalır); bu bilgisayarda hatırlanır ---- */
const TEMA_KEY = "pafta-tema";
function temaAcik(){ return document.documentElement.classList.contains("acik"); }
function temaDegistir(acik, sessiz){
  document.documentElement.classList.toggle("acik", !!acik);
  try { localStorage.setItem(TEMA_KEY, acik ? "acik" : "koyu"); } catch(e){}
  const s = $("opt-tema"); if (s) s.value = acik ? "acik" : "koyu";
  if (!sessiz) draw();
}
$("opt-tema").addEventListener("change", e => temaDegistir(e.target.value === "acik"));
(() => { let t = null; try { t = localStorage.getItem(TEMA_KEY); } catch(e){} temaDegistir(t === "acik", true); })();
