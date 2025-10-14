# Google Analytics Setup Guide

## Step 1: Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon in the bottom left)
4. Under **Account**, click **+ Create Account** (or select existing)
5. Under **Property**, click **+ Create Property**
6. Enter property details:
   - Property name: `VacatAd Website`
   - Reporting time zone: `United Kingdom (GMT)`
   - Currency: `Pound Sterling (£)`
7. Click **Next** and complete business information
8. Click **Create** and accept Terms of Service

## Step 2: Get Your Measurement ID

1. In Admin > Property, click **Data Streams**
2. Click **Add stream** > **Web**
3. Enter:
   - Website URL: `https://vacatad.com`
   - Stream name: `VacatAd Main Site`
4. Click **Create stream**
5. **Copy the Measurement ID** (format: `G-XXXXXXXXXX`)

## Step 3: Update Website Files

### A. Update HTML Files
Replace `G-XXXXXXXXXX` with your actual Measurement ID in these files:

1. **index.html** (line ~54)
2. **contact.html**
3. **local.html**
4. **faqs.html**
5. **privacy.html**
6. **terms.html**
7. **affiliate-program.html**
8. **blog/index.html**
9. All blog post HTML files in **blog/posts/**

**Find this code:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
```

**Replace both instances** of `G-XXXXXXXXXX` with your Measurement ID.

### B. Update JavaScript Config
Edit **js/analytics-config.js** (line 11):

**Change:**
```javascript
measurementId: 'G-XXXXXXXXXX',
```

**To:**
```javascript
measurementId: 'G-1234567890', // Your actual ID
```

## Step 4: Deploy Changes

```bash
# Commit changes
git add -A
git commit -m "Add Google Analytics 4 tracking with measurement ID"

# Push to production
git push origin main
```

## Step 5: Verify Tracking

### Real-time Testing
1. Go to Google Analytics
2. Click **Reports** > **Realtime**
3. Open your website in a new tab
4. You should see your visit appear in real-time (within 30 seconds)

### Debug Mode (Optional)
Add this to your browser console to enable debug mode:
```javascript
gtag('config', 'G-XXXXXXXXXX', {
    'debug_mode': true
});
```

## Step 6: Configure Enhanced Measurements

In Google Analytics > Admin > Data Streams > [Your Stream]:

1. Click **Enhanced measurement**
2. Enable/configure:
   - ✅ Page views (auto-enabled)
   - ✅ Scrolls (tracks 90% scroll)
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ File downloads
   - ⬜ Video engagement (if you add videos)
   - ⬜ Form interactions (handled by Jotform)

## Events Being Tracked

### Automatic Events
- `page_view` - Every page load
- `scroll` - 90% scroll depth
- `click` - Outbound links
- `file_download` - PDF/document downloads

### Custom Events (via our code)
- `phone_call` - Phone number clicks
- `cta_click` - CTA button clicks (with location)
- `form_submit` - Form submissions
- `scroll_depth` - 25%, 50%, 75%, 90% scroll milestones
- `outbound_click` - External link clicks
- `blog_read` - Blog article engagement

## Custom Dimensions (Optional)

To add custom dimensions in GA4:

1. Go to **Admin** > **Custom Definitions**
2. Click **Create custom dimension**
3. Suggested dimensions:
   - **CTA Location** - Where CTA was clicked
   - **Phone Number** - Which number was called
   - **Form Type** - Type of form submitted
   - **Article Title** - Blog post being read

## Goals & Conversions

Set up key conversions in GA4:

1. Go to **Admin** > **Events**
2. Mark these as conversions:
   - `phone_call`
   - `form_submit`
   - `cta_click` (from hero section)

## Privacy & GDPR Compliance

### Current Setup
- Analytics only loads on production (not localhost)
- No personally identifiable information (PII) collected
- Cookie consent not required (analytics-only cookies)

### If You Need Cookie Consent
1. Install a cookie consent tool (e.g., Cookiebot, OneTrust)
2. Update **js/analytics-config.js**:
   ```javascript
   cookieConsent: {
       required: true,
   },
   ```
3. Only load GA after user consent

## Useful Analytics Reports

### Key Metrics to Monitor
1. **Acquisition** > **Traffic acquisition**
   - Where visitors come from
   
2. **Engagement** > **Pages and screens**
   - Most popular pages
   
3. **Engagement** > **Events**
   - Custom event tracking
   
4. **Monetization** > **Conversions**
   - Phone calls, form submissions

### Custom Reports
Create custom reports for:
- Phone call conversion rate by source
- CTA click-through rates by location
- Blog engagement metrics
- Form abandonment rates

## Troubleshooting

### Analytics Not Showing Data
1. **Check Real-time**: Data should appear within 30 seconds
2. **Verify Measurement ID**: Must match exactly (case-sensitive)
3. **Check Console**: Open browser DevTools > Console for errors
4. **Test Environment**: Analytics disabled on localhost by default
5. **Ad Blockers**: Disable ad blockers when testing

### Testing Commands
Open browser console and run:

```javascript
// Check if gtag is loaded
console.log(typeof gtag);  // Should return "function"

// Check dataLayer
console.log(window.dataLayer);  // Should show array of events

// Manually trigger test event
gtag('event', 'test_event', {
    event_category: 'testing',
    event_label: 'manual_test'
});
```

## Best Practices

1. **Regular Monitoring**: Check analytics weekly
2. **Goal Tracking**: Monitor conversion rates
3. **A/B Testing**: Use GA4 experiments for optimization
4. **Audience Insights**: Understand visitor demographics
5. **Custom Alerts**: Set up alerts for traffic drops/spikes

## Additional Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [GA4 vs Universal Analytics](https://support.google.com/analytics/answer/11583528)
- [GA4 Best Practices](https://support.google.com/analytics/topic/9143382)

## Support

For analytics configuration help:
- Email: hello@vacatad.com
- Google Analytics Help: https://support.google.com/analytics

---

**Last Updated:** October 14, 2025  
**Version:** 1.0
