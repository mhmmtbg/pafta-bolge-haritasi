#!/usr/bin/env sh
# PAFTA - ham harita verilerini indirir (tools/veri/ham/). Yalnızca data/ klasörünü
# yeniden üretmek için gerekir; uygulamayı derlemek için gerekmez.
set -e
cd "$(dirname "$0")"
mkdir -p ham && cd ham
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_50m_land ne_50m_admin_0_boundary_lines_land ne_50m_lakes ne_50m_populated_places_simple ne_10m_admin_0_countries_tur; do
  curl -sSL -o "$f.geojson" "$NE/$f.geojson" && echo "  $f"
done
VS=https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master
curl -sSL -o fir.geojson "$VS/Boundaries.geojson" && echo "  Boundaries.geojson (VATSpy)"
curl -sSL -o vatspy.dat  "$VS/VATSpy.dat"         && echo "  VATSpy.dat"
echo "Uydu görüntüsü (NASA Blue Marble NG, 5400x2700): basemap-data Python paketindeki bmng.jpg"
echo "  pip download basemap-data --no-deps  ->  mpl_toolkits/basemap_data/bmng.jpg  ->  data/bluemarble.jpg"
