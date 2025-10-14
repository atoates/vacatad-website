# Sitemap Generator

This directory contains an automated sitemap generator for the VacatAd website.

## Overview

The `generate-sitemap.js` script automatically creates a complete `sitemap.xml` file that includes:
- All static HTML pages with appropriate priorities
- Blog index page
- All blog posts dynamically loaded from `blog/data/posts.json`

## Features

- ✅ **Dynamic blog post inclusion**: Automatically reads all posts from JSON data
- ✅ **Proper date parsing**: Converts blog post dates to ISO format
- ✅ **Priority management**: Featured posts get higher priority (0.7 vs 0.6)
- ✅ **Change frequency**: Appropriate change frequencies per content type
- ✅ **Easy maintenance**: Single source of truth for static pages

## Usage

### Generate sitemap manually:
```bash
node generate-sitemap.js
```

### Or use npm script:
```bash
npm run generate-sitemap
```

## When to regenerate

Run the sitemap generator whenever:
- New blog posts are added to `blog/data/posts.json`
- Static pages are added/removed
- Page priorities need updating
- Dates need refreshing

## Sitemap Structure

### Static Pages
- **Homepage** (`/`): Priority 1.0, weekly updates
- **Contact** (`/contact.html`): Priority 0.9, monthly updates
- **FAQs** (`/faqs.html`): Priority 0.8, monthly updates
- **Local** (`/local.html`): Priority 0.8, monthly updates
- **Blog Index** (`/blog/`): Priority 0.7, weekly updates
- **Affiliate** (`/affiliate-program.html`): Priority 0.6, monthly updates
- **Legal Pages** (`/privacy.html`, `/terms.html`): Priority 0.3, yearly updates

### Blog Posts
- **Featured posts**: Priority 0.7, monthly updates
- **Regular posts**: Priority 0.6, monthly updates
- Date extracted from post metadata

## Customization

Edit `generate-sitemap.js` to:
1. Update `STATIC_PAGES` array to add/remove/modify static pages
2. Adjust priorities and change frequencies
3. Modify date parsing logic if needed

## Output

- **File**: `sitemap.xml` in the root directory
- **Format**: Standard XML sitemap protocol
- **URL Count**: Currently ~23 URLs (8 static + 15 blog posts)

## Integration

The generated sitemap is referenced in:
- `robots.txt`: `Sitemap: https://vacatad.com/sitemap.xml`
- Submitted to search engines via Google Search Console

## Automation

For continuous deployment, add to your build/deploy script:
```bash
npm run generate-sitemap
```

This ensures the sitemap is always up to date when the site is deployed.
