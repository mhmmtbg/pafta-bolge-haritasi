"""Veri üretim betiklerinin ortak yardımcıları (yalnızca standart kütüphane)."""
import json, math, pathlib

BURASI = pathlib.Path(__file__).resolve().parent
HAM = BURASI / "ham"
DATA = BURASI.parent.parent / "data"


def rdp(pts, eps):
    """Ramer–Douglas–Peucker sadeleştirme (derece cinsinden tolerans)."""
    if len(pts) < 3:
        return pts
    yigin = [(0, len(pts) - 1)]
    kalsin = [False] * len(pts)
    kalsin[0] = kalsin[-1] = True
    while yigin:
        s, e = yigin.pop()
        if e <= s + 1:
            continue
        x1, y1 = pts[s]; x2, y2 = pts[e]
        dx, dy = x2 - x1, y2 - y1
        d2 = dx * dx + dy * dy
        enb, ei = -1, -1
        for i in range(s + 1, e):
            x, y = pts[i]
            if d2 == 0:
                d = math.hypot(x - x1, y - y1)
            else:
                t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / d2))
                d = math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
            if d > enb:
                enb, ei = d, i
        if enb > eps:
            kalsin[ei] = True
            yigin += [(s, ei), (ei, e)]
    return [p for p, k in zip(pts, kalsin) if k]


def halka_alani(pts):
    a = 0
    for i in range(len(pts) - 1):
        a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    return abs(a) / 2


def yuvarla(pts, nd=3):
    out, son = [], None
    for x, y in pts:
        p = (round(x, nd), round(y, nd))
        if p != son:
            out.append(p)
            son = p
    return out


def json_yaz(ad, veri):
    s = json.dumps(veri, separators=(",", ":"), ensure_ascii=False)
    (DATA / ad).write_text(s, encoding="utf-8")
    print(f"data/{ad}  {len(s.encode()) / 1024:.0f} KB")
