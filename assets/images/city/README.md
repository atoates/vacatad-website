# City Skyline Images

This directory should contain skyline photos for each city landing page.

## Required Images

Each city page requires a skyline image. Please add high-quality skyline photos for:

- `london-skyline.webp` (or .jpg) - London skyline
- `manchester-skyline.webp` - Manchester skyline  
- `birmingham-skyline.webp` - Birmingham skyline
- `leeds-skyline.webp` - Leeds skyline
- `liverpool-skyline.webp` - Liverpool skyline
- `bristol-skyline.webp` - Bristol skyline
- `sheffield-skyline.webp` - Sheffield skyline
- `edinburgh-skyline.webp` - Edinburgh skyline
- `glasgow-skyline.webp` - Glasgow skyline
- `newcastle-skyline.webp` - Newcastle skyline
- `nottingham-skyline.webp` - Nottingham skyline
- `leicester-skyline.webp` - Leicester skyline

## Image Requirements

- **Format:** WebP preferred, JPG acceptable
- **Dimensions:** 1920x1080 minimum (16:9 aspect ratio)
- **File Size:** Optimized for web (< 500KB recommended)
- **Content:** City skyline showing recognizable landmarks/buildings
- **Style:** Professional, clear, suitable for overlay text

## Current Status

Currently using Unsplash placeholder images. Replace the `url()` in each city page's `.city-hero` CSS with the local image path:

```css
background: linear-gradient(...), url('../assets/images/city/london-skyline.webp');
```

