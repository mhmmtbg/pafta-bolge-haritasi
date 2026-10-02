"""data/fir.json: FIR sınırları ve adları (VATSpy Data Project, CC BY-SA 4.0).

Kayıt biçimi: [ICAO, ad, etiket_boylam, etiket_enlem, [halkalar]]. Bu dosya CC BY-SA 4.0
lisanslı verinin sadeleştirilmiş bir türevidir ve aynı lisansla paylaşılır.
"""
import json, re
from ortak import HAM, rdp, yuvarla, json_yaz

adlar, bolum = {}, None
for satir in (HAM / "vatspy.dat").read_text(encoding="utf-8", errors="replace").splitlines():
    s = satir.strip()
    if s.startswith("["):
        bolum = s
        continue
    if bolum != "[FIRs]" or not s or s.startswith(";"):
        continue
    p = s.split("|")
    if len(p) < 4:
        continue
    sinir, ad = p[3], re.sub(r"\s*\(.*?\)", "", p[1]).strip()
    if len(ad) > 24:
        ad = ad[:23].rstrip() + "…"
    if p[2] == "" and p[0] == sinir:
        adlar[sinir] = ad
    else:
        adlar.setdefault(sinir, ad)

out = {}
for f in json.loads((HAM / "fir.geojson").read_text(encoding="utf-8"))["features"]:
    pr, fid = f["properties"], f["properties"]["id"]
    if not re.fullmatch(r"[A-Z]{4}", fid) or fid.endswith("XX"):
        continue
    g = f["geometry"]
    parcalar = g["coordinates"] if g["type"] == "Polygon" else [r for p in g["coordinates"] for r in p]
    halkalar = []
    for h in parcalar:
        p = yuvarla(rdp([(q[0], q[1]) for q in h], 0.02))
        if len(p) >= 4:
            halkalar.append([v for q in p for v in q])
    if not halkalar:
        continue
    e = out.setdefault(fid, {"n": adlar.get(fid, fid), "lo": round(float(pr.get("label_lon") or 0), 3),
                             "la": round(float(pr.get("label_lat") or 0), 3), "r": []})
    e["r"] += halkalar

json_yaz("fir.json", [[k, v["n"], v["lo"], v["la"], v["r"]] for k, v in sorted(out.items())])
