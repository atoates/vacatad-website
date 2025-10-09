# Fonts Directory

This directory contains custom fonts used in the website.

## Usage:
Add custom fonts here and reference them in CSS using @font-face rules.

Example:
```css
@font-face {
    font-family: 'CustomFont';
    src: url('../assets/fonts/CustomFont.woff2') format('woff2'),
         url('../assets/fonts/CustomFont.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
```

## Recommended formats:
- WOFF2 (primary)
- WOFF (fallback)
- TTF (older browser support)