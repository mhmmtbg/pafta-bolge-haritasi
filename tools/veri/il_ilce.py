"""data/tr_idari.json: Türkiye il ve ilçe sınırları ile ad etiketleri.

Kaynak: geoBoundaries TUR ADM1 (81 il) ve ADM2 (973 ilçe), OpenStreetMap verisinden
(© OpenStreetMap katkıcıları, ODbL 1.0). Bu dosya aynı lisansla paylaşılan bir türevdir.

Yöntem (yalnızca standart kütüphane):
- İlçe poligonlarının kenarları topolojik olarak ortaktır; her kenar bir kez saklanır.
  Tek ilçeye ait kenarlar (kıyı ve ülke sınırı) atılır: onları taban harita zaten çizer.
- İki ilçe farklı illerdeyse aralarındaki kenar il sınırıdır; böylece il ve ilçe sınırları birebir çakışır.
- Kenarlar kavşaklar arasında zincirlenip Ramer–Douglas–Peucker ile sadeleştirilir (kavşaklar sabit kalır).
- Etiket noktası: poligonun içindeki, kenara en uzak nokta (polylabel). İlçenin ili bu noktanın
  hangi il poligonunun içinde kaldığına göre belirlenir.

Biçim:
  {"il":   [[ad, boylam, enlem, alan_km2], ...],
   "ilce": [[ad, il_sirasi, boylam, enlem, alan_km2], ...],
   "zincir":    [[b0, e0, b1, e1, ...], ...],     # ortak sınır zincirleri
   "zTur":      [0 | 1 | 2, ...],                  # il sınırı, ilçe sınırı, dış sınır
   "ilceHalka": [[[+i, -j, ...], ...], ...]}       # ilçe başına halkalar (1 tabanlı zincir no)
"""
import heapq, json, math
from collections import defaultdict
from ortak import HAM, rdp, json_yaz

R = 6371.0088
EPS_IL, EPS_ILCE = 0.0035, 0.0025      # derece; ~300 m ve ~250 m


def poligonlar(g):
    return [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]


def kure_alani(ring):
    t = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        t += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(t) * R * R / 2


def icinde(x, y, poly):
    ic = False
    for ring in poly:
        for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ic = not ic
    return ic


def kenar_uzakligi(x, y, poly):
    """İçerideyse pozitif, dışarıdaysa negatif; en yakın kenara uzaklık (düzlem birimi)."""
    en = float("inf")
    for ring in poly:
        for (ax, ay), (bx, by) in zip(ring, ring[1:]):
            dx, dy = bx - ax, by - ay
            L = dx * dx + dy * dy
            t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / L)) if L else 0.0
            en = min(en, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2)
    return math.sqrt(en) * (1 if icinde(x, y, poly) else -1)


def polylabel(poly, hassasiyet=0.004):
    """Mapbox polylabel: poligon içinde kenara en uzak nokta. Boylam cos(enlem) ile ölçeklenir."""
    k = math.cos(math.radians(sum(p[1] for p in poly[0]) / len(poly[0])))
    P = [[(x * k, y) for x, y in r] for r in poly]
    xs = [p[0] for p in P[0]]; ys = [p[1] for p in P[0]]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    h = min(x1 - x0, y1 - y0) / 2
    if h == 0:
        return x0 / k, y0
    hucre = lambda cx, cy, h: (kenar_uzakligi(cx, cy, P), cx, cy, h)
    kuyruk = []
    def ekle(c):
        heapq.heappush(kuyruk, (-(c[0] + c[3] * math.sqrt(2)), c))
    cx = x0
    while cx < x1:
        cy = y0
        while cy < y1:
            ekle(hucre(cx + h, cy + h, h)); cy += 2 * h
        cx += 2 * h
    # ağırlık merkezi ile başla
    en = hucre((x0 + x1) / 2, (y0 + y1) / 2, 0)
    while kuyruk:
        _, c = heapq.heappop(kuyruk)
        if c[0] > en[0]:
            en = c
        if c[0] + c[3] * math.sqrt(2) - en[0] <= hassasiyet:
            continue
        h2 = c[3] / 2
        for dx in (-h2, h2):
            for dy in (-h2, h2):
                ekle(hucre(c[1] + dx, c[2] + dy, h2))
    return en[1] / k, en[2]


def en_buyuk(polys):
    return max(polys, key=lambda p: kure_alani(p[0]))


adm1 = json.loads((HAM / "tur_ADM1.geojson").read_text(encoding="utf-8"))["features"]
adm2 = json.loads((HAM / "tur_ADM2.geojson").read_text(encoding="utf-8"))["features"]

iller = []
for f in sorted(adm1, key=lambda f: f["properties"]["shapeName"]):
    polys = poligonlar(f["geometry"])
    lx, ly = polylabel(en_buyuk(polys), 0.003)
    iller.append({"ad": f["properties"]["shapeName"], "polys": polys, "lx": lx, "ly": ly,
                  "alan": sum(kure_alani(p[0]) for p in polys)})

ilceler = []
for f in adm2:
    polys = poligonlar(f["geometry"])
    lx, ly = polylabel(en_buyuk(polys), 0.002)
    il = next((i for i, p in enumerate(iller) if any(icinde(lx, ly, q) for q in p["polys"])), None)
    if il is None:                                        # kıyıda sadeleştirme farkı: en yakın il
        il = min(range(len(iller)), key=lambda i: (iller[i]["lx"] - lx) ** 2 + (iller[i]["ly"] - ly) ** 2)
    ilceler.append({"ad": f["properties"]["shapeName"], "il": il, "polys": polys, "lx": lx, "ly": ly,
                    "alan": sum(kure_alani(p[0]) for p in polys)})

# ---- ad düzeltmeleri: merkez ilçeler resmî biçimde ("Çanakkale Merkez"), İngilizce gelen adlar Türkçe ----
import re
OZEL = {"Prince Islands": "Adalar", "Gediz Merkez": "Gediz"}


def ad_duzelt(ad, il_ad):
    if ad in OZEL:
        return OZEL[ad]
    if ad.strip().lower() == "merkez" or re.search(r"\b(district|merkez|merkezi)\b|\(merkez", ad, re.I):
        return il_ad + " Merkez"
    return ad


for c in ilceler:
    c["ad"] = ad_duzelt(c["ad"], iller[c["il"]]["ad"])

# ---- kenarlar: sahip çiftine göre (dış kenar: tek sahip, -1) ----
sahip = defaultdict(list)
for i, c in enumerate(ilceler):
    for poly in c["polys"]:
        for ring in poly:
            pts = [(round(x, 6), round(y, 6)) for x, y in ring]
            for a, b in zip(pts, pts[1:]):
                if a != b:
                    sahip[(a, b) if a < b else (b, a)].append(i)

gruplar = defaultdict(list)                      # (ilçe a, ilçe b | -1) -> kenarlar
for e, s in sahip.items():
    s = sorted(set(s))[:2]
    gruplar[(s[0], s[1] if len(s) > 1 else -1)].append(e)


def zincirle(kenarlar):
    komsu = defaultdict(list)
    for a, b in kenarlar:
        komsu[a].append(b); komsu[b].append(a)
    gorulen, zincirler = set(), []
    def yuru(a, b):
        z = [a, b]; gorulen.add((a, b) if a < b else (b, a))
        while len(komsu[b]) == 2:
            n = komsu[b][0] if komsu[b][1] == a else komsu[b][1]
            k = (b, n) if b < n else (n, b)
            if k in gorulen:
                break
            gorulen.add(k); z.append(n); a, b = b, n
        return z
    for d in komsu:                                      # kavşaklardan başlayan zincirler
        if len(komsu[d]) != 2:
            for n in komsu[d]:
                if ((d, n) if d < n else (n, d)) not in gorulen:
                    zincirler.append(yuru(d, n))
    for a, b in kenarlar:                                # kavşaksız kapalı halkalar
        if (a, b) not in gorulen:
            zincirler.append(yuru(a, b))
    return zincirler


def sadelestir(z, eps):
    """Uçlar sabit kalır; aynı uç her zincirde aynı yuvarlanır, halkalar birebir kapanır."""
    q, son = [], None
    for x, y in rdp(z, eps):
        r = (round(x, 3), round(y, 3))
        if r != son:
            q.append(r); son = r
    if len(q) < 2:
        q = [q[0], q[0]]
    return [v for t in q for v in t]


EPS_DIS = 0.003
zincir, z_tur, z_uc, z_sahip = [], [], [], []
for (a, b), kenarlar in sorted(gruplar.items()):
    tur = 2 if b < 0 else (0 if ilceler[a]["il"] != ilceler[b]["il"] else 1)
    for z in zincirle(kenarlar):
        zincir.append(sadelestir(z, (EPS_IL, EPS_ILCE, EPS_DIS)[tur]))
        z_tur.append(tur); z_uc.append((z[0], z[-1])); z_sahip.append((a, b))

# ---- ilçe halkaları: zincirleri uçlarından birleştir; +i ileri, -i geri (1 tabanlı) ----
ilce_zincir = defaultdict(list)
for i, (a, b) in enumerate(z_sahip):
    ilce_zincir[a].append(i)
    if b >= 0:
        ilce_zincir[b].append(i)
halkalar, eksik = [], 0
for d in range(len(ilceler)):
    zs = ilce_zincir[d]
    uc = defaultdict(list)
    for i in zs:
        uc[z_uc[i][0]].append(i); uc[z_uc[i][1]].append(i)
    kullan, hl = set(), []
    for i in zs:
        if i in kullan:
            continue
        kullan.add(i)
        bas, cur, h = z_uc[i][0], z_uc[i][1], [i + 1]
        while cur != bas:
            n = next((j for j in uc[cur] if j not in kullan), None)
            if n is None:
                eksik += 1; break
            kullan.add(n)
            if z_uc[n][0] == cur:
                h.append(n + 1); cur = z_uc[n][1]
            else:
                h.append(-(n + 1)); cur = z_uc[n][0]
        else:
            hl.append(h)
    halkalar.append(hl)

say = defaultdict(int)
for t in z_tur:
    say[t] += 1
print(f"il: {len(iller)}, ilçe: {len(ilceler)}, zincir: {len(zincir)} (il {say[0]}, ilçe {say[1]}, dış {say[2]}), "
      f"nokta: {sum(len(z) for z in zincir) // 2}, kapanmayan halka: {eksik}")
sayac = defaultdict(int)
for c in ilceler:
    sayac[c["il"]] += 1
print("ilçe sayısı en az / en çok olan il:", min(sayac.values()), max(sayac.values()))

r4 = lambda v: round(v, 4)
json_yaz("tr_idari.json", {
    "il": [[p["ad"], r4(p["lx"]), r4(p["ly"]), round(p["alan"])] for p in iller],
    "ilce": [[c["ad"], c["il"], r4(c["lx"]), r4(c["ly"]), round(c["alan"], 1)] for c in ilceler],
    "zincir": zincir,
    "zTur": z_tur,
    "ilceHalka": halkalar,
})
