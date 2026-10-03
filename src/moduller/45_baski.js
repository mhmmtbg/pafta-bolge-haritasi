/* ============ ölçekli baskı: A4 / A3 PDF ============ */
/* Pafta, kâğıdın basılabilir alanı kadar mantıksal piksele (1 px = 0,2646 mm) çizilir ve seçilen dpi'ya
   ölçeklenir; böylece künyedeki ölçek ve ölçek çubuğu kâğıt üzerinde doğrudur. Görüntü JPEG olarak
   tek sayfalık bir PDF'e gömülür (bağımlılıksız PDF yazıcı). */
const KAGIT = {A4: [297, 210], A3: [420, 297]};          // mm, yatay
const BASKI_KENAR = 10;                                   // mm
const MM_PX = 96 / 25.4;
var BASKI_SURUYOR = false;

function baskiAyar(){
  const [a, b] = KAGIT[$("pdf-kagit").value] || KAGIT.A4, yatay = $("pdf-yon").value === "yatay";
  const wmm = yatay ? a : b, hmm = yatay ? b : a;
  const t = $("pdf-olcek").value.replace(/\s/g, "").replace(/^1:/, "").replace(/[.,]/g, "");
  const olcek = /^\d+$/.test(t) && +t >= 100 ? +t : null;
  return {wmm, hmm, Wl: (wmm - 2 * BASKI_KENAR) * MM_PX, Hl: (hmm - 2 * BASKI_KENAR) * MM_PX, olcek,
          dpi: +$("pdf-dpi").value || 200, ad: $("pdf-kagit").value + " " + (yatay ? "yatay" : "dikey")};
}
/* baskıdaki ölçek (view.k): sabit ölçek ya da ekrandaki alanı sayfaya sığdır */
function baskiK(a){
  if (a.olcek){
    const hedef = a.olcek * 0.00026458;                                   // m / mantıksal px
    const lat = view.mode === "mercator" ? latAt(H / 2) : view.phi0;
    return 111319.49 * Math.cos(rad(lat)) / hedef;
  }
  return view.k * Math.min(a.Wl / W, a.Hl / H);
}

/* ekranda sayfa çerçevesi önizlemesi (Çıktı sekmesi açıkken) */
function drawBaskiCerceve(){
  if (BASKI_SURUYOR) return;
  const p = $("pane-export");
  if (!p || !p.classList.contains("active") || !$("pdf-cerceve").checked) return;
  const a = baskiAyar(), kp = baskiK(a);
  const w = a.Wl / kp * view.k, h = a.Hl / kp * view.k, x = W / 2 - w / 2, y = H / 2 - h / 2;
  ctx.save();
  ctx.fillStyle = "rgba(14,26,33,.18)";
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(x, y, w, h); ctx.fill("evenodd");
  ctx.setLineDash([8, 6]); ctx.strokeStyle = "#f2a93b"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
  const t = a.ad + " · 1:" + Math.round(a.olcek || (111319.49 * Math.cos(rad(view.mode === "mercator" ? latAt(H / 2) : view.phi0)) / kp / 0.00026458)).toLocaleString("tr-TR");
  ctx.font = "600 12px " + FONT();
  const tw = ctx.measureText(t).width + 14;
  const bx = clamp(x, 8, W - tw - 8), by = clamp(y - 26, 8, H - 30);
  ctx.fillStyle = "#f2a93b"; ctx.fillRect(bx, by, tw, 22);
  ctx.fillStyle = "#0e1a21"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(t, bx + 7, by + 11.5);
  ctx.restore();
}

/* yüklenmekte olan döşeme görsellerini bekle */
function gorsellerHazir(sure){
  return new Promise(coz => {
    const bas = performance.now();
    const bak = () => {
      if (DOSEME_BEKLEYEN <= 0 || performance.now() - bas > (sure || 4000)) coz(); else setTimeout(bak, 60);
    };
    bak();
  });
}

async function pdfKaydet(){
  const a = baskiAyar(), k = a.dpi / 96;
  const W0 = W, H0 = H, v0 = Object.assign({}, view), hover0 = HOVER;
  const px = Math.round(a.Wl * k), py = Math.round(a.Hl * k);
  if (px * py > 120e6){ uyar("Bu kâğıt ve çözünürlük için görüntü çok büyük.", "Daha düşük bir dpi seçin."); return; }
  $("btn-pdf").disabled = true; $("btn-pdf").textContent = "Hazırlanıyor…";
  BASKI_SURUYOR = true; HOVER = null; TUTAMAC = null; DOSEME_OLCEK = k;
  let jpeg;
  try {
    view.k = baskiK(a);
    W = a.Wl; H = a.Hl;
    cv.width = px; cv.height = py;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    draw();
    await gorsellerHazir();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    draw();
    const url = cv.toDataURL("image/jpeg", 0.9);
    jpeg = Uint8Array.from(atob(url.split(",")[1]), c => c.charCodeAt(0));
  } finally {
    BASKI_SURUYOR = false; DOSEME_OLCEK = 1; HOVER = hover0;
    Object.assign(view, v0); W = W0; H = H0;
    resize();
    $("btn-pdf").disabled = false; $("btn-pdf").textContent = "PDF kaydet";
  }
  const pt = 72 / 25.4;
  const blob = pdfYap(jpeg, px, py, a.wmm * pt, a.hmm * pt, BASKI_KENAR * pt, BASKI_KENAR * pt, (a.wmm - 2 * BASKI_KENAR) * pt, (a.hmm - 2 * BASKI_KENAR) * pt,
    $("t-title").value.trim() || "Pafta");
  download(dosyaKoku() + ".pdf", blob);
}

/* tek sayfalık PDF: sayfaya yerleştirilmiş bir JPEG */
function pdfYap(jpeg, iw, ih, sw, sh, x, y, w, h, baslik){
  const te = new TextEncoder(), parca = [], ofs = [];
  let boy = 0;
  const yaz = v => { const b = typeof v === "string" ? te.encode(v) : v; parca.push(b); boy += b.length; };
  const nesne = (n, govde) => { ofs[n] = boy; yaz(n + " 0 obj\n"); govde(); yaz("\nendobj\n"); };
  const f = v => (Math.round(v * 100) / 100).toString();
  const utf16 = s => "<FEFF" + [...s].map(c => { const k = c.codePointAt(0); return k > 0xffff ? "" : k.toString(16).padStart(4, "0"); }).join("").toUpperCase() + ">";
  const icerik = "q " + f(w) + " 0 0 " + f(h) + " " + f(x) + " " + f(y) + " cm /Im0 Do Q";
  yaz("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  nesne(1, () => yaz("<< /Type /Catalog /Pages 2 0 R >>"));
  nesne(2, () => yaz("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  nesne(3, () => yaz("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + f(sw) + " " + f(sh) + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"));
  nesne(4, () => { yaz("<< /Type /XObject /Subtype /Image /Width " + iw + " /Height " + ih + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n"); yaz(jpeg); yaz("\nendstream"); });
  nesne(5, () => yaz("<< /Length " + icerik.length + " >>\nstream\n" + icerik + "\nendstream"));
  const d = new Date(), iki = n => String(n).padStart(2, "0");
  nesne(6, () => yaz("<< /Title " + utf16(baslik) + " /Producer (PAFTA " + APP_VER + ") /CreationDate (D:" + d.getFullYear() + iki(d.getMonth() + 1) + iki(d.getDate()) + iki(d.getHours()) + iki(d.getMinutes()) + iki(d.getSeconds()) + ") >>"));
  const xref = boy;
  yaz("xref\n0 7\n0000000000 65535 f \n" + [1, 2, 3, 4, 5, 6].map(n => String(ofs[n]).padStart(10, "0") + " 00000 n \n").join(""));
  yaz("trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  return new Blob(parca, {type: "application/pdf"});
}

$("btn-pdf").onclick = pdfKaydet;
["pdf-kagit", "pdf-yon", "pdf-cerceve"].forEach(id => $(id).addEventListener("change", draw));
$("pdf-olcek").addEventListener("input", draw);
document.querySelectorAll(".tab[data-pane]").forEach(t => t.addEventListener("click", draw));
