#!/usr/bin/env python3
"""PAFTA uydu paketi hazırlayıcı (.paftauydu).

İnternete bağlı bir bilgisayarda çalıştırılır; seçilen bölgenin uydu döşemelerini indirip tek bir
dosyaya paketler. Paket USB bellekle çevrimdışı bilgisayara taşınır ve PAFTA'da
Görünüm > Uydu görüntüsü > "Uydu paketi" ile açılır. Yalnızca Python 3 standart kütüphanesi gerekir.

Varsayılan kaynak: EOX Sentinel-2 cloudless 2016 (10 m çözünürlük, bulutsuz mozaik).
  Lisans: CC BY 4.0. Atıf: "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH
  (Contains modified Copernicus Sentinel data 2016)". Sonraki yılların katmanları (2018 ve sonrası)
  CC BY-NC-SA 4.0'dır: yalnızca ticari olmayan kullanım; --katman ile seçerseniz lisansı size aittir.

Örnekler:
  python uydu_paketi.py                                   # Türkiye, z6–z12 (~30 m), ~500 MB
  python uydu_paketi.py --zmax 13                         # ~15 m, ~2 GB
  python uydu_paketi.py --kapsam 28.5 40.5 30.5 41.6 --zmax 15 -o istanbul.paftauydu
  python uydu_paketi.py --kaynak "https://ornek/{z}/{x}/{y}.jpg" --ad "Kendi kaynağım"

İndirme yarıda kalırsa aynı komutu yeniden çalıştırın: inen döşemeler önbellek klasöründe durur.
"""
import argparse, concurrent.futures, json, math, os, pathlib, struct, sys, time, urllib.request, urllib.error

SIHIR = b"PAFTAUYDU1"
EOX = "https://tiles.maps.eox.at/wmts/1.0.0/{katman}/default/g/{z}/{y}/{x}.jpg"
KATMAN_BILGI = {
    "s2cloudless_3857": ("Sentinel-2 cloudless 2016 (EOX)", "CC BY 4.0",
                         "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)"),
}
TURKIYE = (25.6, 35.7, 44.9, 42.2)


def tr(v, d=0):
    """Türkçe sayı: binlik nokta, ondalık virgül."""
    return f"{v:,.{d}f}".replace(",", "_").replace(".", ",").replace("_", ".")


def doseme_araligi(kapsam, z):
    b0, e0, b1, e1 = kapsam
    n = 2 ** z
    x0 = int((b0 + 180) / 360 * n); x1 = int((b1 + 180) / 360 * n)
    def y(lat):
        r = math.radians(max(-85.05, min(85.05, lat)))
        return int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)
    return range(max(0, x0), min(n - 1, x1) + 1), range(max(0, y(e1)), min(n - 1, y(e0)) + 1)


def liste(kapsam, zmin, zmax):
    out = []
    for z in range(zmin, zmax + 1):
        xs, ys = doseme_araligi(kapsam, z)
        out += [(z, x, y) for x in xs for y in ys]
    return out


def indir(url, hedef, deneme=4):
    if hedef.exists() and hedef.stat().st_size > 0:
        return "var"
    for i in range(deneme):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PAFTA-uydu-paketi/1.0 (cevrimdisi harita)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                veri = r.read()
            if not veri:
                raise IOError("boş yanıt")
            gecici = hedef.with_suffix(".part")
            gecici.write_bytes(veri)
            gecici.replace(hedef)
            return "indi"
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return "yok"
            time.sleep(1.5 * (i + 1))
        except Exception:
            time.sleep(1.5 * (i + 1))
    return "hata"


def paketle(cikti, onbellek, dosemeler, bilgi):
    dizin, konum, parcalar = {}, 0, []
    for z, x, y in dosemeler:
        p = onbellek / str(z) / str(x) / f"{y}.img"
        if p.exists() and p.stat().st_size:
            n = p.stat().st_size
            dizin[f"{z}/{x}/{y}"] = [konum, n]
            parcalar.append(p); konum += n
    if not dizin:
        sys.exit("Hiç döşeme yok; paket oluşturulmadı.")
    bilgi = dict(bilgi, doseme=dizin)
    ham = json.dumps(bilgi, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    gecici = cikti.with_suffix(cikti.suffix + ".part")
    with open(gecici, "wb") as f:
        f.write(SIHIR); f.write(struct.pack("<I", len(ham))); f.write(ham)
        for p in parcalar:
            f.write(p.read_bytes())
    gecici.replace(cikti)
    return len(dizin), cikti.stat().st_size


def main():
    a = argparse.ArgumentParser(description="PAFTA uydu paketi (.paftauydu) hazırlar.",
                                formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    a.add_argument("--kapsam", nargs=4, type=float, metavar=("BATI", "GUNEY", "DOGU", "KUZEY"), default=TURKIYE,
                   help="ondalık derece; varsayılan Türkiye")
    a.add_argument("--zmin", type=int, default=6, help="en kaba seviye (varsayılan 6)")
    a.add_argument("--zmax", type=int, default=12, help="en ince seviye: 12 ≈ 30 m, 13 ≈ 15 m, 14 ≈ 7,5 m (varsayılan 12)")
    a.add_argument("--katman", default="s2cloudless_3857", help="EOX katmanı (varsayılan s2cloudless_3857 = 2016, CC BY 4.0)")
    a.add_argument("--kaynak", help="başka bir XYZ adresi: {z} {x} {y} içermeli")
    a.add_argument("--ad", help="paketin arayüzde görünen adı")
    a.add_argument("--atif", help="paket kaynağının atıf metni")
    a.add_argument("--lisans", help="paket kaynağının lisansı")
    a.add_argument("-o", "--cikti", default="turkiye.paftauydu", help="paket dosyası")
    a.add_argument("--onbellek", help="indirilen döşemelerin klasörü (varsayılan: <çıktı>.onbellek)")
    a.add_argument("--is", dest="esz", type=int, default=4, help="eşzamanlı indirme (varsayılan 4; sunucuyu yormayın)")
    a.add_argument("-e", "--evet", action="store_true", help="onay sormadan başla")
    g = a.parse_args()

    if g.zmin > g.zmax or not (0 <= g.zmin <= 19 and 0 <= g.zmax <= 19):
        sys.exit("Seviyeler 0–19 arasında olmalı ve zmin ≤ zmax.")
    if g.kaynak:
        if not all(s in g.kaynak for s in ("{z}", "{x}", "{y}")):
            sys.exit("--kaynak adresi {z}, {x} ve {y} içermeli.")
        sablon = g.kaynak
        ad, lisans, atif = g.ad or "Uydu paketi", g.lisans or "", g.atif or ""
    else:
        sablon = EOX.replace("{katman}", g.katman)
        ad, lisans, atif = KATMAN_BILGI.get(g.katman, (g.katman + " (EOX)", "CC BY-NC-SA 4.0",
                                            "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data)"))
        ad, lisans, atif = g.ad or ad, g.lisans or lisans, g.atif or atif

    dosemeler = liste(g.kapsam, g.zmin, g.zmax)
    print(f"{ad}: {tr(len(dosemeler))} döşeme, z{g.zmin}–z{g.zmax}, kapsam {list(g.kapsam)}")
    print(f"Tahmini boyut: ~{tr(len(dosemeler) * 22 / 1024)} MB (döşeme başına ~22 KB)")
    if lisans:
        print("Lisans:", lisans)
    if not g.evet and input("Başlansın mı? [e/H] ").strip().lower() not in ("e", "evet", "y", "yes"):
        return

    cikti = pathlib.Path(g.cikti)
    onbellek = pathlib.Path(g.onbellek or str(cikti) + ".onbellek")
    for z, x, _ in dosemeler:
        (onbellek / str(z) / str(x)).mkdir(parents=True, exist_ok=True)
    sayac = {"var": 0, "indi": 0, "yok": 0, "hata": 0}
    bas = time.time()
    with concurrent.futures.ThreadPoolExecutor(max(1, min(g.esz, 8))) as ex:
        isler = {ex.submit(indir, sablon.format(z=z, x=x, y=y), onbellek / str(z) / str(x) / f"{y}.img"): (z, x, y) for z, x, y in dosemeler}
        for i, f in enumerate(concurrent.futures.as_completed(isler), 1):
            sayac[f.result()] += 1
            if i % 200 == 0 or i == len(isler):
                hiz = i / max(1e-6, time.time() - bas)
                print(f"\r{i}/{len(isler)}  indi {sayac['indi']}  vardı {sayac['var']}  yok {sayac['yok']}  hata {sayac['hata']}  "
                      f"~{(len(isler) - i) / max(hiz, 1e-6) / 60:.0f} dk kaldı   ", end="", flush=True)
    print()
    if sayac["hata"]:
        print(f"Uyarı: {sayac['hata']} döşeme inemedi. Komutu yeniden çalıştırırsanız yalnız eksikler indirilir.")

    bilgi = {"surum": 1, "ad": ad, "atif": atif, "lisans": lisans, "zmin": g.zmin, "zmax": g.zmax,
             "kapsam": list(g.kapsam), "olusturma": time.strftime("%Y-%m-%d")}
    n, boy = paketle(cikti, onbellek, dosemeler, bilgi)
    print(f"Hazır: {cikti}  ({tr(n)} döşeme, {tr(boy / 1048576, 1)} MB)")
    print(f"Önbellek klasörü ({onbellek}) artık silinebilir.")


if __name__ == "__main__":
    main()
