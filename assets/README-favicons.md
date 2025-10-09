# Favicon Files

This directory contains favicon files for the VacatAd website.

## Files needed:
- `favicon.svg` - Modern SVG favicon (already created)
- `favicon-32x32.png` - 32x32 PNG favicon for compatibility
- `favicon-16x16.png` - 16x16 PNG favicon for compatibility  
- `apple-touch-icon.png` - 180x180 PNG for iOS devices

## To generate PNG favicons:
You can use online tools like:
- https://realfavicongenerator.net/
- https://favicon.io/

Or use the command line with ImageMagick:
```bash
# Convert SVG to PNG (requires ImageMagick)
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
```

The current implementation uses the SVG favicon with PNG fallbacks referenced in the HTML.