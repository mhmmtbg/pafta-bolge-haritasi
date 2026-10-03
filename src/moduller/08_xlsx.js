/* ============ Excel (.xlsx): bağımlılıksız okuma ve yazma ============
   .xlsx bir ZIP içinde XML dosyalarıdır. Okurken ZIP dizini çözülür, sıkıştırılmış parçalar aşağıdaki
   saf JavaScript inflate ile açılır (WebView2 sürümünden bağımsız). Yazarken sıkıştırmasız ZIP üretilir. */

/* ---- inflate (RFC 1951) ---- */
function inflateRaw(src){
  let pos = 0, bit = 0, buf = 0;
  let out = new Uint8Array(Math.max(1024, src.length * 4)), on = 0;
  const gerek = n => { if (on + n > out.length){ const y = new Uint8Array(Math.max(out.length * 2, on + n)); y.set(out); out = y; } };
  const bits = n => {
    while (bit < n){ if (pos >= src.length) throw new Error("ZIP verisi eksik"); buf |= src[pos++] << bit; bit += 8; }
    const v = buf & ((1 << n) - 1); buf >>>= n; bit -= n; return v;
  };
  const agac = (uz, n) => {                                      // kanonik Huffman: {say[], sembol[]}
    const say = new Uint16Array(16), sembol = new Uint16Array(n), ofs = new Uint16Array(16);
    for (let i = 0; i < n; i++) say[uz[i]]++;
    say[0] = 0;
    for (let i = 1; i < 16; i++) ofs[i] = ofs[i - 1] + say[i - 1];
    for (let i = 0; i < n; i++) if (uz[i]) sembol[ofs[uz[i]]++] = i;
    return {say, sembol};
  };
  const coz = t => {
    let cur = 0, top = 0, l = 0;
    do {
      if (++l > 15) throw new Error("Bozuk Huffman kodu");
      cur = 2 * cur + bits(1); top += t.say[l]; cur -= t.say[l];
    } while (cur >= 0);
    return t.sembol[top + cur];
  };
  const LB = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  const LE = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const DB = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  const DE = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  let sabitL = null, sabitD = null;
  let son;
  do {
    son = bits(1);
    const tur = bits(2);
    if (tur === 0){
      buf = 0; bit = 0;
      const len = src[pos] | (src[pos + 1] << 8); pos += 4;
      gerek(len); out.set(src.subarray(pos, pos + len), on); on += len; pos += len;
      continue;
    }
    let L, D;
    if (tur === 1){
      if (!sabitL){
        const u = new Uint8Array(288);
        u.fill(8, 0, 144); u.fill(9, 144, 256); u.fill(7, 256, 280); u.fill(8, 280, 288);
        sabitL = agac(u, 288); sabitD = agac(new Uint8Array(30).fill(5), 30);
      }
      L = sabitL; D = sabitD;
    } else if (tur === 2){
      const hl = bits(5) + 257, hd = bits(5) + 1, hc = bits(4) + 4;
      const SIRA = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
      const cu = new Uint8Array(19);
      for (let i = 0; i < hc; i++) cu[SIRA[i]] = bits(3);
      const C = agac(cu, 19), uz = new Uint8Array(hl + hd);
      for (let i = 0; i < hl + hd;){
        const s = coz(C);
        if (s < 16) uz[i++] = s;
        else {
          let r, v = 0;
          if (s === 16){ v = uz[i - 1]; r = 3 + bits(2); }
          else if (s === 17) r = 3 + bits(3);
          else r = 11 + bits(7);
          while (r--) uz[i++] = v;
        }
      }
      L = agac(uz.subarray(0, hl), hl); D = agac(uz.subarray(hl), hd);
    } else throw new Error("Bozuk sıkıştırma bloğu");
    for (;;){
      const s = coz(L);
      if (s < 256){ gerek(1); out[on++] = s; }
      else if (s === 256) break;
      else {
        const k = s - 257, len = LB[k] + bits(LE[k]);
        const ds = coz(D), uzak = DB[ds] + bits(DE[ds]);
        gerek(len);
        for (let i = 0; i < len; i++, on++) out[on] = out[on - uzak];
      }
    }
  } while (!son);
  return out.subarray(0, on);
}

/* ---- ZIP ---- */
function zipAc(ab){
  const u = new Uint8Array(ab), dv = new DataView(ab);
  let e = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50){ e = i; break; }
  if (e < 0) throw new Error("Bu bir Excel (.xlsx) dosyası değil.");
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const dosyalar = {}, td = new TextDecoder();
  for (let k = 0; k < n; k++){
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const yontem = dv.getUint16(p + 10, true), boy = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    const yerel = dv.getUint32(p + 42, true), ad = td.decode(u.subarray(p + 46, p + 46 + nl));
    dosyalar[ad] = {yontem, boy, yerel};
    p += 46 + nl + el + cl;
  }
  return {
    var: ad => ad in dosyalar,
    metin(ad){
      const f = dosyalar[ad]; if (!f) return null;
      const bas = f.yerel + 30 + dv.getUint16(f.yerel + 26, true) + dv.getUint16(f.yerel + 28, true);
      const ham = u.subarray(bas, bas + f.boy);
      return td.decode(f.yontem === 0 ? ham : inflateRaw(ham));
    }
  };
}

let CRC_T = null;
function crc32(b){
  if (!CRC_T){ CRC_T = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipYap(dosyalar){                                       // [{ad, metin}] -> Uint8Array, sıkıştırmasız
  const te = new TextEncoder(), parca = [], merkez = [];
  let ofs = 0;
  const d = new Date(), saat = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const tarih = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  dosyalar.forEach(f => {
    const ad = te.encode(f.ad), veri = te.encode(f.metin), crc = crc32(veri);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint16(10, saat, true); h.setUint16(12, tarih, true);
    h.setUint32(14, crc, true); h.setUint32(18, veri.length, true); h.setUint32(22, veri.length, true); h.setUint16(26, ad.length, true);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(12, saat, true); c.setUint16(14, tarih, true);
    c.setUint32(16, crc, true); c.setUint32(20, veri.length, true); c.setUint32(24, veri.length, true); c.setUint16(28, ad.length, true);
    c.setUint32(42, ofs, true);
    parca.push(new Uint8Array(h.buffer), ad, veri);
    merkez.push(new Uint8Array(c.buffer), ad);
    ofs += 30 + ad.length + veri.length;
  });
  const mBoy = merkez.reduce((s, x) => s + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, dosyalar.length, true); e.setUint16(10, dosyalar.length, true);
  e.setUint32(12, mBoy, true); e.setUint32(16, ofs, true);
  const hepsi = parca.concat(merkez, [new Uint8Array(e.buffer)]);
  const out = new Uint8Array(hepsi.reduce((s, x) => s + x.length, 0));
  let k = 0; hepsi.forEach(x => { out.set(x, k); k += x.length; });
  return out;
}

/* ---- .xlsx okuma: [{ad, satirlar: [[hücre, ...], ...]}] ---- */
function xmlBelge(t){ return t ? new DOMParser().parseFromString(t, "application/xml") : null; }
const xmlEtiket = (d, ad) => d ? [...d.getElementsByTagNameNS("*", ad)] : [];
function sutunNo(ref){ let n = 0; for (const ch of ref.replace(/\d+$/, "")) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }

function xlsxOku(ab){
  const z = zipAc(ab);
  if (!z.var("xl/workbook.xml")) throw new Error("Bu bir Excel (.xlsx) dosyası değil.");
  const ortak = xmlEtiket(xmlBelge(z.metin("xl/sharedStrings.xml")), "si").map(si => xmlEtiket(si, "t").map(t => t.textContent).join(""));
  const iliski = {};
  xmlEtiket(xmlBelge(z.metin("xl/_rels/workbook.xml.rels")), "Relationship").forEach(r => {
    let t = r.getAttribute("Target"); t = t.startsWith("/") ? t.slice(1) : "xl/" + t;
    iliski[r.getAttribute("Id")] = t;
  });
  return xmlEtiket(xmlBelge(z.metin("xl/workbook.xml")), "sheet").map((s, i) => {
    const rid = s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || s.getAttribute("r:id");
    const yol = iliski[rid] || "xl/worksheets/sheet" + (i + 1) + ".xml";
    const satirlar = [];
    xmlEtiket(xmlBelge(z.metin(yol)), "row").forEach((row, ri) => {
      const r = (+row.getAttribute("r") || ri + 1) - 1, dizi = satirlar[r] = [];
      xmlEtiket(row, "c").forEach((c, ci) => {
        const ref = c.getAttribute("r"), j = ref ? sutunNo(ref) : ci, t = c.getAttribute("t");
        const v = xmlEtiket(c, "v")[0], deger = v ? v.textContent : "";
        let x;
        if (t === "s") x = ortak[+deger] ?? "";
        else if (t === "inlineStr") x = xmlEtiket(c, "t").map(e => e.textContent).join("");
        else if (t === "str" || t === "e") x = deger;
        else if (t === "b") x = deger === "1";
        else x = deger === "" ? "" : +deger;
        dizi[j] = x;
      });
    });
    for (let k = 0; k < satirlar.length; k++) if (!satirlar[k]) satirlar[k] = [];
    return {ad: s.getAttribute("name") || "Sayfa " + (i + 1), satirlar};
  });
}

/* ---- .xlsx yazma: sayfalar [{ad, satirlar, genislik?: [karakter]}]; ilk satır kalın başlık ---- */
function xlsxYaz(sayfalar){
  const kac = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  const harf = j => { let s = ""; j++; while (j){ const m = (j - 1) % 26; s = String.fromCharCode(65 + m) + s; j = (j - m - 1) / 26; } return s; };
  const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const dosyalar = [
    {ad: "[Content_Types].xml", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sayfalar.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("") + "</Types>"},
    {ad: "_rels/.rels", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {ad: "xl/workbook.xml", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook ' + NS + '><sheets>' +
      sayfalar.map((s, i) => '<sheet name="' + kac(String(s.ad).replace(/[\\\/?*\[\]:]/g, " ").slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join("") + "</sheets></workbook>"},
    {ad: "xl/_rels/workbook.xml.rels", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sayfalar.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("") +
      '<Relationship Id="rId' + (sayfalar.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {ad: "xl/styles.xml", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF0"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}
  ];
  sayfalar.forEach((s, i) => {
    const gen = s.genislik || [];
    const cols = gen.length ? "<cols>" + gen.map((w, j) => '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>').join("") + "</cols>" : "";
    const rows = s.satirlar.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((v, j) => {
      if (v == null || v === "") return "";
      const ref = harf(j) + (ri + 1), st = ri === 0 ? ' s="1"' : (typeof v === "string" && v.includes("\n") ? ' s="2"' : "");
      return typeof v === "number" && isFinite(v) ? '<c r="' + ref + '"' + st + "><v>" + v + "</v></c>"
        : '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + kac(v) + "</t></is></c>";
    }).join("") + "</row>").join("");
    dosyalar.push({ad: "xl/worksheets/sheet" + (i + 1) + ".xml", metin: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet ' + NS + '>' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + "<sheetData>" + rows + "</sheetData></worksheet>"});
  });
  return new Blob([zipYap(dosyalar)], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
