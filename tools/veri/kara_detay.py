"""data/kara_detay.json: Türkiye ve çevresi için ayrıntılı kara ve göller (Natural Earth 1:10m, kamu malı).

Taban harita 1:50m'dir; il ve ilçe ölçeğine yaklaşıldığında bu bölgede 1:10m kıyıya geçilir.
Poligonlar bölge kutusuna kırpılır (Sutherland–Hodgman); uygulama bu katmanı yalnızca görünüm kutunun
tamamen içindeyken kullanır, böylece kırpma kenarları hiç görünmez.
"""
import json
from ortak import HAM, rdp, halka_alani, yuvarla, json_yaz

KUTU = (17.5, 28.0, 52.0, 48.5)          # boylam0, enlem0, boylam1, enlem1
EPS = 0.002                              # ~200 m


def kirp(ring, k):
    x0, y0, x1, y1 = k
    kenarlar = [(lambda p: p[0] >= x0, lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0]))),
                (lambda p: p[0] <= x1, lambda a, b: (x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0]))),
                (lambda p: p[1] >= y0, lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0)),
                (lambda p: p[1] <= y1, lambda a, b: (a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1))]
    out = [tuple(p) for p in ring]
    for ic, kes in kenarlar:
        if not out:
            break
        gir, out = out, []
        onceki = gir[-1]
        for p in gir:
            if ic(p):
                if not ic(onceki):
                    out.append(kes(onceki, p))
                out.append(p)
            elif ic(onceki):
                out.append(kes(onceki, p))
            onceki = p
    return out


def katman(dosya, min_alan):
    out = []
    for f in json.loads((HAM / dosya).read_text(encoding="utf-8"))["features"]:
        g = f["geometry"]
        for poly in ([g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]):
            for ring in poly:
                xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
                if max(xs) < KUTU[0] or min(xs) > KUTU[2] or max(ys) < KUTU[1] or min(ys) > KUTU[3]:
                    continue
                k = kirp(ring, KUTU)
                if len(k) < 4:
                    continue
                k.append(k[0])
                if halka_alani(k) < min_alan:
                    continue
                p = yuvarla(rdp(k, EPS), 3)
                if len(p) >= 4:
                    out.append([v for q in p for v in q])
    return out


kara = katman("ne_10m_land.geojson", 0.0004)
gol = katman("ne_10m_lakes.geojson", 0.0004)
print(f"kara: {len(kara)} halka, {sum(len(r) for r in kara) // 2} nokta; göl: {len(gol)} halka")
json_yaz("kara_detay.json", {"kutu": list(KUTU), "land": kara, "lakes": gol})
