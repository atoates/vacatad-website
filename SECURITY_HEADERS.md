# Security Headers Configuration

## Required Security Headers

The following security headers need to be configured at the server/hosting level:

### 1. Strict Transport Security (HSTS)
**Status:** ⚠️ Missing - Needs server configuration

**Purpose:** Forces browsers to use HTTPS only

**Configuration:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Where to add:**
- **GitHub Pages:** Not directly configurable. GitHub Pages automatically enforces HTTPS.
- **Custom hosting:** Add to `.htaccess` (Apache) or server config (Nginx)

**Apache (.htaccess):**
```apache
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>
```

**Nginx:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

### 2. Content Security Policy (CSP)
**Status:** ⚠️ Missing - Needs server configuration

**Purpose:** Prevents XSS attacks by controlling which resources can be loaded

**Configuration:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src https://www.jotform.com https://www.pipedrive.com;
```

**Where to add:**
- **GitHub Pages:** Not directly configurable. Consider using meta tags as fallback.
- **Custom hosting:** Add to `.htaccess` (Apache) or server config (Nginx)

**Apache (.htaccess):**
```apache
<IfModule mod_headers.c>
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src https://www.jotform.com https://www.pipedrive.com;"
</IfModule>
```

**Nginx:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src https://www.jotform.com https://www.pipedrive.com;" always;
```

**Meta tag fallback (if server headers not possible):**
Add to `<head>` section of all pages:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src https://www.jotform.com https://www.pipedrive.com;">
```

---

### 3. X-Frame-Options
**Status:** ⚠️ Missing - Needs server configuration

**Purpose:** Prevents clickjacking attacks

**Configuration:**
```
X-Frame-Options: SAMEORIGIN
```

**Where to add:**
Same as above - server configuration or meta tag fallback.

**Meta tag fallback:**
```html
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
```

---

### 4. X-Content-Type-Options
**Status:** ⚠️ Missing - Needs server configuration

**Purpose:** Prevents MIME type sniffing

**Configuration:**
```
X-Content-Type-Options: nosniff
```

**Where to add:**
Same as above - server configuration or meta tag fallback.

**Meta tag fallback:**
```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
```

---

## Implementation Notes

### For GitHub Pages:
GitHub Pages automatically enforces HTTPS, which provides some security. However, custom security headers cannot be directly configured on GitHub Pages.

**Options:**
1. **Use Cloudflare** (if using custom domain):
   - Add security headers via Cloudflare's Page Rules or Workers
   - Free tier available

2. **Use meta tags** (less secure but better than nothing):
   - Add CSP, X-Frame-Options, and X-Content-Type-Options as meta tags
   - Note: Meta tags are less secure than HTTP headers

3. **Migrate to hosting with header support:**
   - Netlify (supports `_headers` file)
   - Vercel (supports `vercel.json`)
   - Custom server with full control

### For Custom Hosting:
1. Create `.htaccess` file (Apache) or update Nginx config
2. Add the headers as shown above
3. Test using: https://securityheaders.com

---

## Testing

After implementation, test headers using:
- https://securityheaders.com
- Browser DevTools → Network tab → Check Response Headers
- https://observatory.mozilla.org/

---

## Current Status

- ✅ HTTPS enforced (GitHub Pages default)
- ⚠️ HSTS: Not configured (needs server config)
- ⚠️ CSP: Not configured (needs server config)
- ⚠️ X-Frame-Options: Not configured (needs server config)
- ⚠️ X-Content-Type-Options: Not configured (needs server config)

---

**Last Updated:** November 13, 2025

