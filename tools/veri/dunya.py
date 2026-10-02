"""data/world.json: kara, göller, ülke sınırları, şehirler (Natural Earth 1:50m, kamu malı)."""
import json
from ortak import HAM, rdp, halka_alani, yuvarla, json_yaz


def topla(dosya, eps, min_alan, kapali):
    out = []
    for f in json.loads((HAM / dosya).read_text(encoding="utf-8"))["features"]:
        g = f["geometry"]
        if not g:
            continue
        t, c = g["type"], g["coordinates"]
        parcalar = {"Polygon": c, "MultiPolygon": [r for p in c for r in p] if t == "MultiPolygon" else [],
                    "LineString": [c], "MultiLineString": c}.get(t, [])
        for p in parcalar:
            p = [(q[0], q[1]) for q in p]
            if kapali and halka_alani(p) < min_alan:
                continue
            p = yuvarla(rdp(p, eps))
            if len(p) >= (4 if kapali else 2):
                out.append([v for q in p for v in q])
    return out


sehir = []
for f in json.loads((HAM / "ne_50m_populated_places_simple.geojson").read_text(encoding="utf-8"))["features"]:
    p = f["properties"]
    if p["scalerank"] <= 4 or p["adm0cap"] == 1:
        x, y = f["geometry"]["coordinates"][:2]
        sehir.append([round(x, 3), round(y, 3), p["name"], int(p["scalerank"])])

json_yaz("world.json", {
    "land": topla("ne_50m_land.geojson", 0.02, 0.02, True),
    "lakes": topla("ne_50m_lakes.geojson", 0.02, 0.05, True),
    "borders": topla("ne_50m_admin_0_boundary_lines_land.geojson", 0.02, 0, False),
    "cities": sehir,
})
