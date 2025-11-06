# PWA Icons

This directory should contain the following PWA icon files:

- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-152.png` (152x152)
- `icon-192.png` (192x192)
- `icon-384.png` (384x384)
- `icon-512.png` (512x512)

These icons are referenced in the `manifest.json` file for Progressive Web App functionality.

## How to Generate Icons

### Option 1: Using ImageMagick (Recommended)

If you have ImageMagick installed, run the provided script:

```bash
cd public/icons
./generate-icons.sh
```

To install ImageMagick:
- **Ubuntu/Debian**: `sudo apt-get install imagemagick`
- **macOS**: `brew install imagemagick`
- **Windows**: Download from https://imagemagick.org/script/download.php

### Option 2: Online Tools (Easiest)

Use one of these free online tools to generate all sizes at once:

1. **PWA Builder Image Generator** (Recommended)
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload `../Icon.png`
   - Download all generated sizes
   - Extract to this directory

2. **Real Favicon Generator**
   - Visit: https://realfavicongenerator.net/
   - Upload your icon
   - Configure for PWA
   - Download and extract

3. **Favicon.io**
   - Visit: https://favicon.io/favicon-converter/
   - Upload `../Icon.png`
   - Download package

### Option 3: Manual Resize (Any Image Editor)

Use any image editor (Photoshop, GIMP, Preview, Paint.NET, etc.):

1. Open `../Icon.png` (388x388)
2. Resize to each required size
3. Export as PNG
4. Name files as: `icon-72.png`, `icon-96.png`, etc.

### Option 4: Use Node.js Package (For CI/CD)

Install sharp package:
```bash
npm install --save-dev sharp
```

Create a script in `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/Icon.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`✓ Generated icon-${size}.png`);
  }
  console.log('✓ All PWA icons generated!');
}

generateIcons().catch(console.error);
```

Run: `node scripts/generate-icons.js`

## Temporary Workaround

If you can't generate the icons immediately, you can temporarily:

1. Copy `../Icon.png` to all required filenames
2. This will work but icons won't be optimized for each size
3. Replace with properly sized icons later

```bash
cd public/icons
for size in 72 96 128 144 152 192 384 512; do
  cp ../Icon.png icon-${size}.png
done
```

## Verification

After generating icons, verify they're correctly referenced:
- Check `public/manifest.json`
- Test PWA installation on mobile device
- Icons should appear in app drawer and splash screen
