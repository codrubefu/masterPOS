# PWA Icons

This directory contains the icons for the masterPOS Progressive Web App.

## Current Files
- `icon.svg` - Source SVG icon for the application

## Required PNG Icons
To complete the PWA setup, you need to generate the following PNG files from the SVG:

- `icon-192x192.png` - 192x192 pixels
- `icon-512x512.png` - 512x512 pixels

## How to Generate PNG Icons

### Option 1: Using Online Converter
1. Go to https://convertio.co/svg-png/ or similar online converter
2. Upload the `icon.svg` file
3. Convert to PNG and download in both required sizes

### Option 2: Using ImageMagick (if installed)
```bash
# Convert to 192x192
magick icon.svg -resize 192x192 icon-192x192.png

# Convert to 512x512
magick icon.svg -resize 512x512 icon-512x512.png
```

### Option 3: Using Inkscape (if installed)
```bash
# Convert to 192x192
inkscape icon.svg --export-type=png --export-filename=icon-192x192.png --export-width=192 --export-height=192

# Convert to 512x512
inkscape icon.svg --export-type=png --export-filename=icon-512x512.png --export-width=512 --export-height=512
```

### Option 4: Using Node.js script
A conversion script is available in the project root: `scripts/generate-icons.js`
Run: `npm run generate-icons`

## Screenshots
The `screenshots` directory should contain:
- `desktop-1.png` - Desktop view screenshot (1280x720)
- `mobile-1.png` - Mobile view screenshot (375x667)

Take screenshots of your app running to show users what to expect.