# Custom Domain Setup Guide - vacatad.com

**Date:** October 15, 2025  
**Domain:** vacatad.com  
**Hosting:** GitHub Pages  
**Repository:** atoates/vacatad-website

---

## 📋 Prerequisites

- ✅ GitHub repository: `atoates/vacatad-website`
- ✅ Domain registered: `vacatad.com`
- ✅ Access to your domain registrar's DNS settings
- ✅ Code ready to deploy

---

## 🚀 Step-by-Step Setup

### **Step 1: Enable GitHub Pages**

1. Go to your repository: https://github.com/atoates/vacatad-website
2. Click **Settings** (top navigation)
3. Click **Pages** (left sidebar)
4. Under "Source":
   - Branch: Select `main`
   - Folder: Select `/ (root)`
   - Click **Save**

✅ Your site will now be live at: `https://atoates.github.io/vacatad-website/`

---

### **Step 2: Add CNAME File** ⚠️ IMPORTANT

Before configuring DNS, you need to add a `CNAME` file to your repository.

**Create the file:**

I'll create this file for you now in the repository root.

The file should contain only:
```
vacatad.com
```

---

### **Step 3: Configure DNS at Your Domain Registrar**

You need to add DNS records at your domain registrar (where you bought vacatad.com).

#### **Option A: Apex Domain (vacatad.com) - RECOMMENDED**

Add **4 A records** pointing to GitHub's IP addresses:

```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600 (or Auto)

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600 (or Auto)

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600 (or Auto)

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600 (or Auto)
```

**AND** add a **CNAME record** for www:

```
Type: CNAME
Name: www
Value: atoates.github.io
TTL: 3600 (or Auto)
```

#### **Option B: Subdomain Only (www.vacatad.com)**

If you only want www.vacatad.com:

```
Type: CNAME
Name: www
Value: atoates.github.io
TTL: 3600 (or Auto)
```

---

### **Step 4: Configure Custom Domain in GitHub**

1. Go back to: **Repository → Settings → Pages**
2. Under "Custom domain":
   - Enter: `vacatad.com`
   - Click **Save**
3. Wait a few moments (GitHub will verify the DNS)
4. ✅ Check the box: **Enforce HTTPS** (once DNS verification completes)

⏱️ **Note:** DNS verification can take 1-5 minutes. GitHub will show a status indicator.

---

### **Step 5: Wait for DNS Propagation**

- **Local/ISP:** 5-30 minutes
- **Global:** Up to 48 hours (usually much faster)

**Check propagation status:**
- https://www.whatsmydns.net/#A/vacatad.com
- https://www.whatsmydns.net/#CNAME/www.vacatad.com

---

### **Step 6: Verify HTTPS/SSL Certificate**

GitHub automatically provisions a free SSL certificate via Let's Encrypt.

1. Once DNS is verified, GitHub will show: ✅ **"DNS check successful"**
2. Enable: **Enforce HTTPS**
3. Certificate provisioning takes ~1 hour
4. Your site will be accessible at:
   - ✅ https://vacatad.com
   - ✅ https://www.vacatad.com

---

## 🔍 Common Domain Registrars - DNS Setup Locations

### **GoDaddy**
1. Go to: https://dnsmanagement.godaddy.com/
2. Find your domain → Click **DNS**
3. Add records in the "Records" section

### **Namecheap**
1. Go to: Domain List → Manage
2. Advanced DNS tab
3. Add records under "Host Records"

### **Cloudflare**
1. Dashboard → Select domain
2. DNS tab
3. Add records
⚠️ If using Cloudflare proxy, ensure "DNS Only" (gray cloud) for GitHub Pages

### **Google Domains** (now Squarespace)
1. My domains → Manage → DNS
2. Custom records section
3. Add A and CNAME records

### **Route 53 (AWS)**
1. Hosted zones → Select domain
2. Create record sets
3. Add A and CNAME records

---

## 🛠️ Troubleshooting

### Issue: "Domain is improperly configured"

**Solution:**
1. Verify A records exactly match GitHub's IPs
2. Check CNAME file exists with just `vacatad.com`
3. Wait 5-10 minutes for DNS propagation
4. Try removing and re-adding the custom domain

### Issue: "Certificate provisioning failed"

**Solution:**
1. Remove custom domain from GitHub Pages settings
2. Wait 10 minutes
3. Re-add domain
4. Enable HTTPS again

### Issue: "Mixed content warnings"

**Solution:**
- Ensure all resources use `https://` or relative URLs
- Check: images, stylesheets, scripts, fonts
- Your site already uses relative URLs ✅

### Issue: "www not redirecting to apex domain"

**Solution:**
- Ensure both A records (apex) and CNAME (www) are configured
- GitHub handles redirects automatically when both are set up

### Issue: "Site showing old GitHub Pages URL"

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Check DNS propagation with whatsmydns.net
4. Wait for CDN cache to clear (up to 1 hour)

---

## 📊 Verification Checklist

Once setup is complete, verify:

- [ ] `vacatad.com` loads your site
- [ ] `www.vacatad.com` loads your site
- [ ] Both redirect to HTTPS
- [ ] SSL certificate is valid (green padlock)
- [ ] No mixed content warnings
- [ ] All pages load correctly
- [ ] Forms and CTAs work
- [ ] Phone links work
- [ ] Blog posts accessible
- [ ] Sitemap accessible: https://vacatad.com/sitemap.xml
- [ ] Robots.txt accessible: https://vacatad.com/robots.txt

---

## 🔒 Security & Performance

### HTTPS Enforcement
✅ Always enforce HTTPS to ensure:
- Secure data transmission
- Better SEO rankings
- User trust (green padlock)
- Required for modern browser features

### HTTP Strict Transport Security (HSTS)
GitHub Pages automatically sets HSTS headers once HTTPS is enabled:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CDN & Caching
GitHub Pages uses Fastly CDN for:
- ✅ Fast global loading
- ✅ DDoS protection
- ✅ Automatic caching

---

## 📈 Post-Setup: SEO Configuration

Once domain is live, update:

### 1. Google Search Console
1. Add property: https://vacatad.com
2. Verify ownership (HTML file method)
3. Submit sitemap: https://vacatad.com/sitemap.xml

### 2. Google Analytics (when ready)
- Update property domain from localhost to vacatad.com
- Replace `G-XXXXXXXXXX` in analytics-config.js

### 3. Social Media
Update all social profiles:
- LinkedIn
- Facebook  
- Twitter/X
- Update website field to: https://vacatad.com

### 4. Email Signatures
Update team email signatures to use new domain

---

## 🎯 Expected Timeline

| Step | Time |
|------|------|
| Enable GitHub Pages | Instant |
| Add CNAME file | 1 minute |
| Configure DNS | 5-10 minutes |
| DNS verification | 1-5 minutes |
| DNS propagation (local) | 5-30 minutes |
| SSL certificate provisioning | 30-60 minutes |
| Global DNS propagation | Up to 48 hours |

**Typical total time:** 1-2 hours for full setup with HTTPS

---

## 📞 Need Help?

### GitHub Pages Documentation
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

### GitHub Support
- https://support.github.com/

### Domain Registrar Support
Contact your domain registrar if:
- Can't access DNS settings
- Records not saving
- Need help locating DNS management

---

## ✅ Quick Reference - DNS Records

**Copy these exact values into your DNS:**

```
A Record #1
Name: @
Value: 185.199.108.153

A Record #2
Name: @
Value: 185.199.109.153

A Record #3
Name: @
Value: 185.199.110.153

A Record #4
Name: @
Value: 185.199.111.153

CNAME Record
Name: www
Value: atoates.github.io
```

---

## 🚨 Important Notes

1. **CNAME file must contain ONLY the domain** - no http://, no www, just `vacatad.com`
2. **Don't use A records for www** - Use CNAME pointing to atoates.github.io
3. **Wait for DNS propagation** - Don't panic if it takes 30 minutes
4. **Enable HTTPS immediately** - Once DNS verification passes
5. **Keep CNAME file in repository** - Don't delete it or domain will break
6. **Test in incognito mode** - Avoids browser cache issues

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ GitHub Pages shows "DNS check successful"
2. ✅ Green checkmark next to "Enforce HTTPS"
3. ✅ https://vacatad.com loads your site with green padlock
4. ✅ https://www.vacatad.com redirects to https://vacatad.com
5. ✅ No certificate warnings
6. ✅ All resources load over HTTPS

---

**Ready to go live? Let's do this! 🚀**
