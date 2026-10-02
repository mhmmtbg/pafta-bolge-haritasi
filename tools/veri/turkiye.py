"""data/turkey.json: Türkiye kara sınırı ve kıyısı (Natural Earth 1:10m, Türkiye görüş açısı sürümü)."""
import json
from ortak import HAM, rdp, yuvarla, json_yaz

d = json.loads((HAM / "ne_10m_admin_0_countries_tur.geojson").read_text(encoding="utf-8"))
tr = next(f for f in d["features"] if f["properties"].get("ADM0_A3") == "TUR")
g = tr["geometry"]
parcalar = g["coordinates"] if g["type"] == "Polygon" else [r for p in g["coordinates"] for r in p]
halkalar = []
for h in parcalar:
    p = yuvarla(rdp([(q[0], q[1]) for q in h], 0.004), 4)
    if len(p) >= 5:
        halkalar.append([v for q in p for v in q])
halkalar.sort(key=len, reverse=True)
json_yaz("turkey.json", halkalar)
