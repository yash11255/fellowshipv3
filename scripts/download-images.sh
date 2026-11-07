#!/bin/bash
# Downloads all product images (original resolution) from Shopify CDN into public/products/{handle}/NN-name
cd "$(dirname "$0")/.."
CDN="https://cdn.shopify.com/s/files/1/0901/5066/6540/files"
python3 -I -c "
import json
m=json.load(open('.raw/images-map.json'))
for h,imgs in m.items():
  for i,f in enumerate(imgs): print(h, '%02d'%(i+1), f)
" | while read h n f; do
  mkdir -p public/products/$h; out="public/products/$h/$n-$f"
  [ -s "$out" ] || curl -sf -o "$out" "$CDN/$f" || echo "FAIL $h $f"
done
echo "files: $(find public/products -type f | wc -l)  size: $(du -sh public/products | cut -f1)"
