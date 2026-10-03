/* ============ uydu: yaklaştıkça netleşen döşemeler ============ */
/* Web Mercator (z/x/y) döşemeleri. Kaynaklar sırayla çizilir: gömülü NASA döşemeleri, varsa uydu paketi.
   Her kaynakta görünüm için uygun seviyeye kadar kaba seviyeler önce, ince seviyeler üstüne çizilir;
   böylece ince döşemesi olmayan yerlerde kaba olan görünür kalır. */
var DOSEME_KAYNAKLARI = [];
var DOSEME_BEKLEYEN = 0;      // çözülmekte olan döşeme görselleri (baskıda beklenir)
var DOSEME_OLCEK = 1;        // baskıda aygıt pikseli / mantıksal piksel: daha ince seviye seçilir

function gorselOnbellek(sinir){
  const m = new Map();
  return {
    al(k){ const v = m.get(k); if (v){ m.delete(k); m.set(k, v); } return v; },
    koy(k, v){
      m.set(k, v);
      while (m.size > sinir){ const [ilk, im] = m.entries().next().value; m.delete(ilk); if (im && im._url) URL.revokeObjectURL(im._url); }
    }
  };
}

function gomuluDosemeKaynagi(){
  const ob = gorselOnbellek(600);
  const zler = Object.keys(UYDU_D.doseme).map(k => +k.split("/")[0]);
  return {
    ad: "NASA Blue Marble (GIBS)", zmin: Math.min(...zler), zmax: Math.max(...zler),
    var: k => k in UYDU_D.doseme,
    gorsel(k){
      let im = ob.al(k);
      if (!im){
        im = new Image();
        DOSEME_BEKLEYEN++;
        im.onload = () => { DOSEME_BEKLEYEN--; scheduleDraw(); };
        im.onerror = () => { DOSEME_BEKLEYEN--; };
        im.src = "data:image/jpeg;base64," + UYDU_D.doseme[k];
        ob.koy(k, im);
      }
      return im.complete && im.naturalWidth ? im : null;
    }
  };
}
DOSEME_KAYNAKLARI.push(gomuluDosemeKaynagi());

const dLat = (y, n) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
const dY = (lat, n) => (1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2 * n;

/* görünüm için gereken döşeme seviyesi: döşeme pikseli ekran pikselinden kaba olmasın */
function dosemeSeviyesi(){
  const lat = clamp(latAt(H / 2), -80, 80);
  return Math.ceil(Math.log2(156543.03 * Math.cos(rad(lat)) * DOSEME_OLCEK / metersPerPixel()) - 0.15);
}

function dosemeCiz(im, z, x, y){
  const n = 2 ** z;
  const lon0 = x / n * 360 - 180, lon1 = (x + 1) / n * 360 - 180;
  const X0 = sx(lon0), X1 = sx(lon1);
  if (view.mode === "mercator"){
    const Y0 = sy(dLat(y, n)), Y1 = sy(dLat(y + 1, n));
    ctx.drawImage(im, 0, 0, 256, 256, X0, Y0, X1 - X0 + .6, Y1 - Y0 + .6);
    return;
  }
  for (let i = 0; i < 8; i++){                      // eş uzaklıklı silindirik: Mercator döşemesi şeritlerle bükülür
    const Y0 = sy(dLat(y + i / 8, n)), Y1 = sy(dLat(y + (i + 1) / 8, n));
    ctx.drawImage(im, 0, i * 32, 256, 32, X0, Y0, X1 - X0 + .6, Y1 - Y0 + .6);
  }
}

function drawDosemeler(){
  const zIdeal = dosemeSeviyesi();
  if (zIdeal < 5) return;                           // bu ölçekte gömülü dünya görüntüsü yeterli
  const b = viewBounds();
  ctx.save();
  ctx.globalAlpha = $("opt-sat-alpha").value / 100;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  let enInce = 0;
  for (const src of DOSEME_KAYNAKLARI){
    const zUst = Math.min(zIdeal, src.zmax);
    for (let z = Math.max(src.zmin, zUst - 3); z <= zUst; z++){
      const n = 2 ** z;
      const x0 = Math.max(0, Math.floor((b.lonMin + 180) / 360 * n)), x1 = Math.min(n - 1, Math.floor((b.lonMax + 180) / 360 * n));
      const y0 = Math.max(0, Math.floor(dY(Math.min(b.latMax, 85), n))), y1 = Math.min(n - 1, Math.floor(dY(Math.max(b.latMin, -85), n)));
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 400) continue;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++){
        const k = z + "/" + x + "/" + y;
        if (!src.var(k)) continue;
        const im = src.gorsel(k);
        if (im){ dosemeCiz(im, z, x, y); enInce = Math.max(enInce, z); }
      }
    }
  }
  ctx.restore();
  UYDU_SEVIYE = enInce;
}
var UYDU_SEVIYE = 0;                                // künyede zemin açıklaması için
