"""PAFTA - tek dosyalık HTML'i üretir: src/ + data/  ->  app/pafta.html

Kullanım:  python tools/build_html.py
Yalnızca Python standart kütüphanesi kullanılır.
"""
import base64, json, pathlib

KOK = pathlib.Path(__file__).resolve().parent.parent
SRC, DATA, OUT = KOK / "src", KOK / "data", KOK / "app" / "pafta.html"


def oku(p):
    return p.read_text(encoding="utf-8")


def main():
    surum = oku(KOK / "VERSION").strip()
    html = oku(SRC / "pafta.src.html")
    app = oku(SRC / "app.js").replace("/*__VER__*/", surum)
    for ad in ("world.json", "fir.json", "turkey.json", "mavivatan.json", "tr_idari.json", "kara_detay.json"):
        json.loads(oku(DATA / ad))                      # bozuk veri derlemeye girmesin
    yer = {
        "/*__WORLD__*/null": oku(DATA / "world.json"),
        "/*__FIR__*/null": oku(DATA / "fir.json"),
        "/*__TR__*/null": oku(DATA / "turkey.json"),
        "/*__MV__*/null": oku(DATA / "mavivatan.json"),
        "/*__ADM__*/null": oku(DATA / "tr_idari.json"),
        "/*__KD__*/null": oku(DATA / "kara_detay.json"),
        "/*__SAT__*/": base64.b64encode((DATA / "bluemarble.jpg").read_bytes()).decode("ascii"),
        "/*__APP__*/": app,
    }
    for k, v in yer.items():
        if html.count(k) != 1:
            raise SystemExit(f"Yer tutucu bulunamadı ya da birden fazla: {k}")
        html = html.replace(k, v)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8", newline="\n")
    print(f"{OUT.relative_to(KOK)}  ({OUT.stat().st_size / 1024 / 1024:.1f} MB, sürüm {surum})")


if __name__ == "__main__":
    main()
