"""PAFTA uygulama ikonu: assets/icon.ico (çok boyutlu) ve assets/icon.png üretir.

İkon, uygulamanın imgesidir: dereceli (siyah-beyaz bölmeli) pafta çerçevesi içinde,
köşeleri işaretli macenta bir alan. 16-24 px'de ayrıntılar okunmayacağı için sadeleştirilmiş çizim kullanılır.

Gereksinim: Pillow (yalnızca ikonu yeniden üretmek için; uygulama derlemesi gerektirmez).
Kullanım:  python tools/make_icon.py
"""
import io, pathlib, struct
from PIL import Image, ImageDraw, ImageFilter

KOK = pathlib.Path(__file__).resolve().parent.parent
KREM, MUREKKEP, BEYAZ = (244, 236, 218, 255), (22, 34, 42, 255), (255, 255, 255, 255)
MACENTA, KILAVUZ = (196, 20, 106, 255), (205, 191, 163, 255)
ALAN = [(17, 23), (34, 16), (47.5, 27.5), (42.5, 46), (21.5, 43.5)]      # 64'lük ızgarada
BOLME = 7                                                                 # kenar başına (tek sayı: köşeler koyu)


def cerceve_bolmeleri(u=1.0):
    """Dereceli pafta çerçevesinin bölmeleri: [(dikdörtgen, renk), ...]; 4..8 birimlik bant."""
    dis, ic = 4 * u, 8 * u
    uz = (56 * u) / BOLME
    out = []
    for i in range(BOLME):
        renk = MUREKKEP if i % 2 == 0 else BEYAZ
        s0, s1 = dis + i * uz, dis + (i + 1) * uz
        out += [([s0, dis, s1, ic], renk), ([64 * u - ic, s0, 64 * u - dis, s1], renk),
                ([s0, 64 * u - ic, s1, 64 * u - dis], renk), ([dis, s0, ic, s1], renk)]
    return out


def svg_isaret():
    """Arayüzdeki işaret: ikonla aynı geometri, SVG olarak."""
    hx = lambda c: "#%02x%02x%02x" % c[:3]
    r = lambda k: f'<rect x="{k[0]:g}" y="{k[1]:g}" width="{k[2]-k[0]:g}" height="{k[3]-k[1]:g}"/>'
    koyu = "".join(r(k) for k, c in cerceve_bolmeleri() if c == MUREKKEP)
    acik = "".join(r(k) for k, c in cerceve_bolmeleri() if c == BEYAZ)
    nok = " ".join(f"{x:g} {y:g}" for x, y in ALAN)
    return ('<svg viewBox="0 0 64 64" aria-hidden="true">'
            f'<rect x="4" y="4" width="56" height="56" fill="{hx(KREM)}"/>'
            f'<path d="M24.5 8v48M39.5 8v48M8 24.5h48M8 39.5h48" stroke="{hx(KILAVUZ)}" stroke-width=".9"/>'
            f'<g fill="#fff">{acik}</g><g fill="{hx(MUREKKEP)}">{koyu}</g>'
            f'<g fill="none" stroke="{hx(MUREKKEP)}" stroke-width="1.1"><rect x="4" y="4" width="56" height="56"/><rect x="8" y="8" width="48" height="48"/></g>'
            f'<path d="M{nok}Z" fill="rgba(196,20,106,.25)" stroke="{hx(MACENTA)}" stroke-width="2.8" stroke-linejoin="round"/>'
            f'<g fill="#fff" stroke="{hx(MACENTA)}" stroke-width="1.6">'
            + "".join(f'<circle cx="{x:g}" cy="{y:g}" r="2.5"/>' for x, y in ALAN) + '</g></svg>')


def ciz(boyut):
    """64 birimlik tasarımı 'boyut' piksele çizer (8 kat büyük çizip küçültür)."""
    K = 8
    n = boyut * K
    u = n / 64.0                                         # bir tasarım birimi
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    sade = boyut <= 24
    pay = 2 if sade else 4                               # pafta kenarı (birim)
    a, b = pay * u, (64 - pay) * u

    if boyut >= 48:                                      # yumuşak gölge
        g = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        ImageDraw.Draw(g).rectangle([a + 1.2 * u, a + 2.4 * u, b + 1.2 * u, b + 2.4 * u], fill=(0, 0, 0, 120))
        im = Image.alpha_composite(g.filter(ImageFilter.GaussianBlur(2.2 * u)), im)
        d = ImageDraw.Draw(im)

    d.rectangle([a, a, b, b], fill=KREM)
    if not sade:
        for t in (24.5, 39.5):                           # kılavuz çizgileri
            d.line([(t * u, 8 * u), (t * u, 56 * u)], fill=KILAVUZ, width=max(1, round(.9 * u)))
            d.line([(8 * u, t * u), (56 * u, t * u)], fill=KILAVUZ, width=max(1, round(.9 * u)))
        # dereceli çerçeve: 4..8 bandı, kenar başına 7 bölme; köşeler hep koyu
        for kut, renk in cerceve_bolmeleri(u):
            d.rectangle(kut, fill=renk)
        for k in ([4 * u, 4 * u, 60 * u, 60 * u], [8 * u, 8 * u, 56 * u, 56 * u]):
            d.rectangle(k, outline=MUREKKEP, width=max(1, round(1.1 * u)))
    else:
        d.rectangle([a, a, b, b], outline=MUREKKEP, width=round(2.2 * u))

    if sade:                                             # küçük boyutta alanı büyüt
        m = 32
        nokta = [(m + (x - m) * 1.18, m + (y - m) * 1.18 + .5) for x, y in ALAN]
    else:
        nokta = ALAN
    p = [(x * u, y * u) for x, y in nokta]
    dolgu = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    ImageDraw.Draw(dolgu).polygon(p, fill=(196, 20, 106, 70 if not sade else 90))
    im = Image.alpha_composite(im, dolgu)
    d = ImageDraw.Draw(im)
    w = (2.8 if not sade else 5.2) * u
    d.line(p + [p[0]], fill=MACENTA, width=round(w), joint="curve")
    for x, y in p:                                       # yuvarlak köşe birleşimleri
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=MACENTA)
    if boyut >= 32:
        r = 2.5 * u
        for x, y in p:
            d.ellipse([x - r, y - r, x + r, y + r], fill=BEYAZ, outline=MACENTA, width=round(1.6 * u))
    return im.resize((boyut, boyut), Image.LANCZOS)


def ico_yaz(yol, resimler):
    """Her boyutu kendi çizimiyle (PNG sıkıştırmalı) içeren .ico dosyası."""
    veriler = []
    for im in resimler:
        b = io.BytesIO()
        im.save(b, "PNG", optimize=True)
        veriler.append(b.getvalue())
    bas = struct.pack("<HHH", 0, 1, len(resimler))
    ofs = 6 + 16 * len(resimler)
    girdiler = b""
    for im, v in zip(resimler, veriler):
        w = im.width if im.width < 256 else 0
        girdiler += struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(v), ofs)
        ofs += len(v)
    yol.write_bytes(bas + girdiler + b"".join(veriler))


def main():
    hedef = KOK / "assets"
    hedef.mkdir(exist_ok=True)
    boyutlar = [16, 20, 24, 32, 40, 48, 64, 128, 256]
    resimler = [ciz(s) for s in boyutlar]
    ico_yaz(hedef / "icon.ico", resimler)
    resimler[-1].save(hedef / "icon.png")
    # önizleme: tüm boyutlar açık ve koyu zemin üzerinde
    W = sum(boyutlar) + 12 * len(boyutlar) + 12
    on = Image.new("RGBA", (W, 2 * 268 + 12), (255, 255, 255, 255))
    ImageDraw.Draw(on).rectangle([0, 268 + 6, W, 2 * 268 + 12], fill=(10, 20, 26, 255))
    x = 12
    for s, im in zip(boyutlar, resimler):
        on.alpha_composite(im, (x, 134 - s // 2))
        on.alpha_composite(im, (x, 268 + 6 + 134 - s // 2))
        x += s + 12
    on.save(hedef / "icon-onizleme.png")
    (hedef / "mark.svg").write_text(svg_isaret(), encoding="utf-8")
    print("assets/icon.ico, icon.png, mark.svg yazıldı:", ", ".join(map(str, boyutlar)))


if __name__ == "__main__":
    main()
