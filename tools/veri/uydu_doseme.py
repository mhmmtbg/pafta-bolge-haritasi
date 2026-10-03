"""data/uydu_doseme.json: yaklaştıkça netleşen uydu katmanı için döşemeler.

Kaynak: NASA Blue Marble Shaded Relief + Bathymetry (NASA Earth Observatory / GIBS, NASA açık veri politikası),
FreeTiler'ın Web Mercator (EPSG:3857), 256 piksellik döşemeleri: github.com/freetiler/nasa-bluemarble.
Görüntünün kendi çözünürlüğü ~500 m'dir; z8 bunun karşılığıdır.

Kapsam (seçenek A): z6 ve z7 Türkiye + Mavi Vatan + ~500 km çevre, z8 yalnız Türkiye ve yakın denizler.
Biçim: {"kaynak": ..., "doseme": {"z/x/y": "<base64 JPEG>", ...}}
"""
import base64, json, math, subprocess, pathlib
from concurrent.futures import ThreadPoolExecutor
from ortak import HAM, DATA

KOK = "https://raw.githubusercontent.com/freetiler/nasa-bluemarble/main/tiles"
KAPSAM = {6: (17.5, 28.0, 52.0, 48.5), 7: (17.5, 28.0, 52.0, 48.5), 8: (24.5, 33.6, 45.2, 42.6)}
DIZIN = HAM / "uydu"


def doseme(lat, lon, z):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def liste():
    out = []
    for z, (lo0, la0, lo1, la1) in KAPSAM.items():
        x0, y1 = doseme(la0, lo0, z)
        x1, y0 = doseme(la1, lo1, z)
        out += [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    return out


def indir(t):
    z, x, y = t
    f = DIZIN / f"{z}_{x}_{y}.jpeg"
    if not f.exists() or f.stat().st_size < 500:
        subprocess.run(["curl", "-sSL", "--retry", "3", "-o", str(f), f"{KOK}/{z}/{x}/{y}.jpeg"], check=True)
    return t, f


DIZIN.mkdir(parents=True, exist_ok=True)
with ThreadPoolExecutor(8) as ex:
    sonuc = list(ex.map(indir, liste()))
doseme_ = {}
for (z, x, y), f in sonuc:
    b = f.read_bytes()
    if b[:2] != b"\xff\xd8":
        raise SystemExit(f"Bozuk döşeme: {f}")
    doseme_[f"{z}/{x}/{y}"] = base64.b64encode(b).decode("ascii")
toplam = sum(len(v) for v in doseme_.values())
s = json.dumps({"kaynak": "NASA Blue Marble Shaded Relief + Bathymetry (NASA EO / GIBS), FreeTiler döşemeleri",
                "doseme": doseme_}, separators=(",", ":"))
(DATA / "uydu_doseme.json").write_text(s, encoding="utf-8")
say = {z: sum(1 for k in doseme_ if k.startswith(f"{z}/")) for z in KAPSAM}
print(f"data/uydu_doseme.json  {len(s) / 1024 / 1024:.1f} MB  döşeme: {say}")
