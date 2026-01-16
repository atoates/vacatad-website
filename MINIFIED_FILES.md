# Minified Files Guide

## Overview
Minified versions of CSS and JavaScript files have been created to improve page load performance.

## File Size Reductions

| File | Original | Minified | Reduction |
|------|----------|----------|-----------|
| styles.css | 60 KB | 42 KB | 30% |
| script.js | 27 KB | 11 KB | 59% |
| analytics-config.js | 3.4 KB | 1.4 KB | 59% |
| footer-component.js | 5.5 KB | 5.4 KB | 2% |
| **Total** | **96 KB** | **59.8 KB** | **38%** |

## Available Minified Files

- `css/styles.min.css` (42 KB)
- `js/script.min.js` (11 KB)
- `js/analytics-config.min.js` (1.4 KB)
- `js/footer-component.min.js` (5.4 KB)

## Usage

### For Production (Recommended)

Update HTML file references to use minified versions:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/styles.min.css?v=20260116">

<!-- JavaScript -->
<script src="js/analytics-config.min.js"></script>
<script src="js/script.min.js"></script>
<script src="js/footer-component.min.js"></script>
```

### For Development

Keep using original files for easier debugging:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/styles.css?v=20260116">

<!-- JavaScript -->
<script src="js/analytics-config.js"></script>
<script src="js/script.js"></script>
<script src="js/footer-component.js"></script>
```

## Regenerating Minified Files

When you update the original CSS or JS files, regenerate minified versions:

### CSS Minification
```bash
npx clean-css-cli css/styles.css -o css/styles.min.css
```

### JavaScript Minification
```bash
npx terser js/script.js -o js/script.min.js -c -m
npx terser js/analytics-config.js -o js/analytics-config.min.js -c -m
npx terser js/footer-component.js -o js/footer-component.min.js -c -m
```

## Build Automation (Future)

Consider adding to `package.json`:

```json
{
  "scripts": {
    "minify:css": "clean-css-cli css/styles.css -o css/styles.min.css",
    "minify:js": "terser js/script.js -o js/script.min.js -c -m && terser js/analytics-config.js -o js/analytics-config.min.js -c -m && terser js/footer-component.js -o js/footer-component.min.js -c -m",
    "minify": "npm run minify:css && npm run minify:js"
  }
}
```

Then run: `npm run minify`

## Performance Impact

- **38% reduction** in total CSS/JS file size
- **Faster page load times** (estimated 100-300ms improvement)
- **Better Core Web Vitals** scores
- **Reduced bandwidth usage** for users

## Best Practices

1. **Keep both versions**: Original for development, minified for production
2. **Version control**: Commit both original and minified files
3. **Update together**: Always regenerate minified files after editing originals
4. **Test minified**: Verify site functionality with minified versions before deploying

## GitHub Pages Deployment

GitHub Pages serves files as-is, so:
- Minified files are available immediately after push
- No build step required
- Update HTML references to use `.min.css` and `.min.js`

---

**Created:** January 16, 2026
**Last Updated:** January 16, 2026
