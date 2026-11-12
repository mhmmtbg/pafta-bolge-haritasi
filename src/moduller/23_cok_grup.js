/* ============ çok gruplu nokta tablosu: bir satırda birden çok enlem/boylam çifti ============ */
/* Örnek başlık: Count, başlangıç noktası enlem, başlangıç noktası boylam, bitiş enlem, bitiş boylam,
   as1 enlem, as1_xverisi, as1_boylam, as2 enlem, ... Başlıkta "enlem"/"boylam" (ya da lat/lon) geçen sütunlar
   kalan adlarına göre eşleşir; her çift bir nokta grubudur ve kendi rengini alır. Bütün satırlarda (neredeyse) aynı
   kalan grup (başlangıç, bitiş) tek nokta olarak yazılır. */

const GRUP_RENKLERI = ["#d62828", "#1d4ed8", "#2a9d4a", "#7b2cbf", "#e07a00", "#0e7490", "#c2185b", "#6b8e23", "#8d5524", "#455a64",
                       "#b8860b", "#00838f", "#5e35b1", "#ad1457", "#2e7d32", "#ef6c00"];

/* CSV / TSV / noktalı virgüllü metin -> satır dizisi (tırnaklı alanlar desteklenir) */
function csvOku(metin){
  metin = metin.replace(/^﻿/, "");
  const ilk = (metin.split(/\r?\n/).find(l => l.trim()) || "");
  const ayir = ["\t", ";", ","].map(a => [a, ilk.split(a).length]).sort((x, y) => y[1] - x[1])[0][0];
  const out = []; let satir = [], alan = "", tirnak = false;
  for (let i = 0; i < metin.length; i++){
    const c = metin[i];
    if (tirnak){
      if (c === '"'){ if (metin[i + 1] === '"'){ alan += '"'; i++; } else tirnak = false; }
      else alan += c;
    } else if (c === '"' && !alan) tirnak = true;
    else if (c === ayir){ satir.push(alan); alan = ""; }
    else if (c === "\n" || c === "\r"){
      if (c === "\r" && metin[i + 1] === "\n") i++;
      satir.push(alan); out.push(satir); satir = []; alan = "";
    } else alan += c;
  }
  if (alan || satir.length){ satir.push(alan); out.push(satir); }
  return out;
}

const ENLEM_RE = /enlem|latitude|(^|[^a-zğüşıöç])lat([^a-zğüşıöç]|$)/i, BOYLAM_RE = /boylam|longitude|(^|[^a-zğüşıöç])(lon|lng|long)([^a-zğüşıöç]|$)/i;
/* başlık hücresinden grup adı: enlem/boylam sözcüğü ve kenardaki ayraçlar atılır */
function grupAdi(h){
  return String(h).replace(/enlem|latitude|boylam|longitude/ig, " ").replace(/(^|[^a-zğüşıöç])(lat|lon|lng|long)(?=[^a-zğüşıöç]|$)/ig, "$1 ")
    .replace(/[\s_\-.:()\[\]]+/g, " ").trim();
}
function cokGrupCoz(tablo){
  const bi = tablo.findIndex(r => r.some(v => v !== "" && v != null));
  if (bi < 0) return null;
  const baslik = tablo[bi].map(v => v == null ? "" : String(v).trim());
  const la = [], lo = [];
  baslik.forEach((h, j) => { if (ENLEM_RE.test(h)) la.push(j); else if (BOYLAM_RE.test(h)) lo.push(j); });
  if (la.length < 2 || lo.length < 2) return null;
  // aynı adlı enlem ve boylam eşleşir; eşi bulunamayanlar sırayla eşleşir
  const anahtar = j => grupAdi(baslik[j]).toLocaleLowerCase("tr");
  const kalanLo = lo.slice(), gruplar = [], esiz = [];
  la.forEach(j => {
    const k = kalanLo.findIndex(m => anahtar(m) === anahtar(j));
    if (k >= 0) gruplar.push({j, m: kalanLo.splice(k, 1)[0]}); else esiz.push(j);
  });
  esiz.forEach((j, i) => { if (kalanLo[i] != null) gruplar.push({j, m: kalanLo[i]}); });
  if (gruplar.length < 2) return null;
  gruplar.sort((a, b) => a.j - b.j);
  const sayCol = baslik.findIndex(h => /^(count|sayı|sayi|sayaç|sayac|no|sıra|sira|id|#|index)$/i.test(h));
  return {
    gruplar: gruplar.map((g, i) => ({ad: grupAdi(baslik[g.j]) || "Grup " + (i + 1), la: g.j, lo: g.m})),
    sayCol, satirlar: tablo.slice(bi + 1).filter(r => r.some(v => v !== "" && v != null))
  };
}

/* hücre değeri -> koordinat metni (Excel sayısı, ondalık virgül) */
function grupHucre(v){
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  const t = String(v).trim();
  return /^[+-]?\d+,\d+$/.test(t) ? t.replace(",", ".") : t;
}
/* çözülmüş tablo -> nokta listesi satırları ve özet */
function cokGrupMetin(g, renkBas){
  const n = g.satirlar.length, satirlar = [], ozet = [];
  let okunamayan = 0;
  g.gruplar.forEach((gr, gi) => {
    const renk = GRUP_RENKLERI[(gi + (renkBas || 0)) % GRUP_RENKLERI.length];
    const noktalar = [];
    g.satirlar.forEach((r, i) => {
      const a = grupHucre(r[gr.la]), b = grupHucre(r[gr.lo]);
      if (!a && !b) return;
      const k = koordBul(a + "\t" + b);
      if (!k || k.hata){ okunamayan++; return; }
      const no = g.sayCol >= 0 && r[g.sayCol] !== "" && r[g.sayCol] != null ? String(r[g.sayCol]).trim() : String(i + 1);
      noktalar.push({lat: k.lat, lon: k.lon, no});
    });
    if (!noktalar.length){ ozet.push({ad: gr.ad, renk, say: 0, sabit: false}); return; }
    const farkli = new Map();
    noktalar.forEach(p => { const key = p.lat.toFixed(6) + "," + p.lon.toFixed(6); if (!farkli.has(key)) farkli.set(key, p); });
    // her satırda tekrarlanan konum (başlangıç, bitiş): tek nokta
    const sabit = noktalar.length > 1 && farkli.size <= Math.max(1, Math.floor(noktalar.length * .05));
    const yaz = (ad, p) => satirlar.push(ad + "\t" + p.lat.toFixed(6) + "\t" + p.lon.toFixed(6) + "\t" + renk);
    if (sabit){
      let i = 0;
      farkli.forEach(p => yaz(gr.ad + (farkli.size > 1 ? " " + (++i) : ""), p));
    } else noktalar.forEach(p => yaz(gr.ad + " #" + p.no, p));
    ozet.push({ad: gr.ad, renk, say: sabit ? farkli.size : noktalar.length, sabit, satir: noktalar.length});
  });
  return {metin: satirlar.join("\n"), ozet, okunamayan, satirSay: n};
}
function cokGrupYukle(g, ad, ekle){
  const ta = $("p-input");
  const renkBas = ekle && ta.value.trim() ? new Set(POINTS.map(p => p.color)).size : 0;
  const r = cokGrupMetin(g, renkBas);
  sekmeAc("pane-points");
  ta.value = ekle && ta.value.trim() ? ta.value.replace(/\s+$/, "") + "\n" + r.metin : r.metin;
  ta.dispatchEvent(new Event("input", {bubbles: true}));
  buildPoints();
  const f = v => v.toLocaleString("tr-TR");
  const parca = r.ozet.map(o => o.ad + ": " + (o.sabit ? f(o.say) + " nokta (" + f(o.satir) + " satırda aynı)" : f(o.say) + " nokta")).join(" · ");
  $("p-msg").innerHTML = '<span class="ok">' + esc(ad) + ": " + f(r.satirSay) + " satır, " + r.ozet.length + " grup.</span><br>" +
    r.ozet.map(o => '<span class="grup-renk" style="background:' + o.renk + '"></span>' + esc(o.ad) + ": " + (o.sabit ? f(o.say) + " nokta (tekrar eden konum tek gösterildi)" : f(o.say) + " nokta")).join("<br>") +
    (r.okunamayan ? '<br><span class="warn">' + f(r.okunamayan) + " koordinat okunamadı (atlandı).</span>" : "");
  toast(ad + ": " + r.ozet.length + " nokta grubu yüklendi");
  return parca;
}

/* tablo dosyasından çok gruplu tablo çıkar (yoksa null) */
async function cokGrupDosya(f){
  try {
    if (/\.(xlsx|xlsm)$/i.test(f.name)){
      const s = xlsxOku(await f.arrayBuffer()).find(s => s.satirlar.some(r => r.some(v => v !== "" && v != null)));
      return s ? cokGrupCoz(s.satirlar) : null;
    }
    if (/\.(csv|tsv|txt)$/i.test(f.name)) return cokGrupCoz(csvOku(await f.text()));
  } catch (e){}
  return null;
}
const dosyaYukleTekGrup = dosyaYukle;
dosyaYukle = async function(f, hedef, ekle){
  const g = await cokGrupDosya(f);
  if (g){ cokGrupYukle(g, f.name, ekle); return; }
  return dosyaYukleTekGrup(f, hedef);
};
const dosyalariYukleTekGrup = dosyalariYukle;
dosyalariYukle = async function(liste, hedef){
  const dosyalar = [...liste];
  if (dosyalar.length < 2) return dosyalariYukleTekGrup(dosyalar, hedef);
  const kalan = [];
  let ilk = true;
  for (const f of dosyalar){
    const g = await cokGrupDosya(f);
    if (g){ cokGrupYukle(g, f.name, !ilk); ilk = false; } else kalan.push(f);
  }
  if (kalan.length) return dosyalariYukleTekGrup(kalan, hedef);
};
