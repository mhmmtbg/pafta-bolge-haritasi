"""data/mavivatan.json: Mavi Vatan dış sınırının geometrik yeniden kurulumu.

Açık erişimli resmî bir Mavi Vatan koordinat seti olmadığı için poligon doktrinin kendi kuralıyla kurulur:
deniz yetki alanları ana kara kıyıları arasında eşit uzaklığa (medyan hat) göre bölünür; ana kara sayılmayan
adalar (Girit, Rodos, Kıbrıs, Ege adaları) karasuyu dışında alan üretmez. Ayrımı ANAKARA_MIN_KM2 eşiği yapar.
Sonuç resmî koordinat değildir; denizlere göre alanlar yayımlanmış rakamlarla karşılaştırılarak yazdırılır.

Gereksinim: numpy, scipy, matplotlib, scikit-image (yalnızca bu betik için).
"""
import json
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree
from matplotlib.path import Path
from skimage import measure
from ortak import HAM, json_yaz

R = 6371.0088
ANAKARA_MIN_KM2 = 20000
BOLGE = (21.0, 29.5, 46.5, 47.5)          # boylam0, enlem0, boylam1, enlem1
ADIM_KM, HUCRE_KM = 2.0, 1.2


def kure_alani(p):
    lo, la = np.radians(p[:, 0]), np.radians(p[:, 1])
    if lo[0] != lo[-1] or la[0] != la[-1]:
        lo, la = np.append(lo, lo[0]), np.append(la, la[0])
    return abs(np.sum((lo[1:] - lo[:-1]) * (2 + np.sin(la[:-1]) + np.sin(la[1:])))) * R * R / 2


lon0, lat0, lon1, lat1 = BOLGE
kutuda = lambda r: not (r[:, 0].max() < lon0 or r[:, 0].min() > lon1 or r[:, 1].max() < lat0 or r[:, 1].min() > lat1)
tr, diger, kara = [], [], []
for f in json.loads((HAM / "ne_10m_admin_0_countries_tur.geojson").read_text(encoding="utf-8"))["features"]:
    g = f["geometry"]
    for poly in ([g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]):
        halkalar = [np.asarray(r) for r in poly]
        if not kutuda(halkalar[0]):
            continue
        kara.append(halkalar)
        if f["properties"].get("ADM0_A3") == "TUR":
            tr.append(halkalar)
        elif kure_alani(halkalar[0]) >= ANAKARA_MIN_KM2:
            diger.append(halkalar)


def ornekle(polys):
    out = []
    for poly in polys:
        for p in poly:
            s = p[1:] - p[:-1]
            orta = np.radians((p[1:, 1] + p[:-1, 1]) / 2)
            n = np.maximum(1, np.ceil(np.hypot(s[:, 0] * 111.32 * np.cos(orta), s[:, 1] * 110.574) / ADIM_KM)).astype(int)
            for i in range(len(n)):
                t = np.arange(n[i]) / n[i]
                out.append(np.stack([p[i, 0] + s[i, 0] * t, p[i, 1] + s[i, 1] * t], 1))
    return np.vstack(out)


def xyz(a):
    lo, la = np.radians(a[:, 0]), np.radians(a[:, 1])
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], 1)


dlat = HUCRE_KM / 110.574
dlon = HUCRE_KM / (111.32 * np.cos(np.radians((lat0 + lat1) / 2)))
lons, lats = np.arange(lon0, lon1 + dlon, dlon), np.arange(lat0, lat1 + dlat, dlat)
LO, LA = np.meshgrid(lons, lats)


def raster(polys):
    m = np.zeros(LO.shape, bool)
    for poly in polys:
        for k, h in enumerate(poly):
            i0 = max(np.searchsorted(lons, h[:, 0].min()) - 1, 0); i1 = min(np.searchsorted(lons, h[:, 0].max()) + 2, len(lons))
            j0 = max(np.searchsorted(lats, h[:, 1].min()) - 1, 0); j1 = min(np.searchsorted(lats, h[:, 1].max()) + 2, len(lats))
            if i1 <= i0 or j1 <= j0:
                continue
            c = Path(h).contains_points(np.stack([LO[j0:j1, i0:i1].ravel(), LA[j0:j1, i0:i1].ravel()], 1)).reshape(j1 - j0, i1 - i0)
            if k == 0:
                m[j0:j1, i0:i1] |= c
            else:
                m[j0:j1, i0:i1] &= ~c
    return m


deniz = ~raster(kara)
q = xyz(np.stack([LO[deniz], LA[deniz]], 1))
d_tr, _ = cKDTree(xyz(ornekle(tr))).query(q, workers=-1)
d_ot, _ = cKDTree(xyz(ornekle(diger))).query(q, workers=-1)
alan = np.zeros(LO.shape, bool)
alan[deniz] = d_tr < d_ot

HUCRE = np.repeat((R * R * np.radians(dlon) * (np.sin(np.radians(lats + dlat / 2)) - np.sin(np.radians(lats - dlat / 2))))[:, None], len(lons), 1)
km2 = lambda m: float((HUCRE * m).sum())
print(f"Mavi Vatan alanı: {km2(alan):,.0f} km²  (yayımlanan ≈ 462.000)")
kutu = {"Karadeniz": (27.2, 41.05, 42.6, 47.5), "Marmara": (26.7, 40.15, 30.3, 41.05),
        "Ege": (21.0, 34.8, 28.55, 41.05), "Akdeniz": (28.55, 29.5, 46.5, 41.05)}
yayin = {"Karadeniz": 172000, "Marmara": 12000, "Ege": 89000, "Akdeniz": 189000}
for ad, (a, b, c, e) in kutu.items():
    m = alan & (LO >= a) & (LO <= c) & (LA >= b) & (LA <= e)
    if ad == "Ege":
        k = kutu["Marmara"]
        m &= ~((LO >= k[0]) & (LO <= k[2]) & (LA >= k[1]) & (LA <= k[3]))
    print(f"  {ad:<10}{km2(m):>10,.0f} km²   yayımlanan {yayin[ad]:>8,}")

dolu = ndimage.binary_fill_holes(alan | raster(tr))      # dış sınır: deniz limiti + kara sınırı


def sadelestir(p, eps):
    yig, k = [(0, len(p) - 1)], np.zeros(len(p), bool)
    k[0] = k[-1] = True
    while yig:
        s, e = yig.pop()
        if e <= s + 1:
            continue
        a, d = p[s], p[e] - p[s]
        L, seg = d @ d, p[s + 1:e]
        t = np.clip(((seg - a) @ d) / L, 0, 1) if L else np.zeros(len(seg))
        dist = np.hypot(*(seg - (a + t[:, None] * d)).T)
        i = int(dist.argmax())
        if dist[i] > eps:
            k[s + 1 + i] = True
            yig += [(s, s + 1 + i), (s + 1 + i, e)]
    return p[k]


halkalar = []
for c in measure.find_contours(dolu.astype(float), 0.5):
    ll = np.stack([lon0 + c[:, 1] * dlon, lat0 + c[:, 0] * dlat], 1)
    if kure_alani(ll) >= 300:
        s = np.round(sadelestir(ll, 0.012), 3)
        if len(s) >= 5:
            halkalar.append([float(v) for p in s for v in p])
json_yaz("mavivatan.json", halkalar)
