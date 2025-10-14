/**
 * Analytics Configuration
 * 
 * To set up Google Analytics:
 * 1. Go to https://analytics.google.com/
 * 2. Create a GA4 property
 * 3. Get your Measurement ID (starts with G-)
 * 4. Replace 'G-XXXXXXXXXX' below with your actual ID
 * 5. Update the same ID in all HTML files (index.html, contact.html, etc.)
 */

const ANALYTICS_CONFIG = {
    // Google Analytics 4 Measurement ID
    measurementId: 'G-XXXXXXXXXX',
    
    // Enable/disable based on environment
    enabled: !['localhost', '127.0.0.1'].includes(window.location.hostname),
    
    // Cookie consent settings
    cookieConsent: {
        required: false, // Set to true if you need cookie consent banner
        cookieDomain: 'auto',
        cookieExpires: 63072000, // 2 years in seconds
    },
    
    // Event tracking settings
    tracking: {
        scrollDepth: true,      // Track scroll depth
        outboundLinks: true,    // Track external link clicks
        fileDownloads: true,    // Track PDF/file downloads
        videoEngagement: false,  // Track video plays (if you add videos)
    }
};

// Initialize enhanced tracking features
if (ANALYTICS_CONFIG.enabled && typeof gtag !== 'undefined') {
    
    // Track scroll depth
    if (ANALYTICS_CONFIG.tracking.scrollDepth) {
        let scrollTracked = {
            25: false,
            50: false,
            75: false,
            90: false
        };
        
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            
            Object.keys(scrollTracked).forEach(depth => {
                if (scrollPercent >= depth && !scrollTracked[depth]) {
                    scrollTracked[depth] = true;
                    gtag('event', 'scroll_depth', {
                        event_category: 'engagement',
                        event_label: `${depth}%`,
                        value: parseInt(depth)
                    });
                }
            });
        });
    }
    
    // Track outbound links
    if (ANALYTICS_CONFIG.tracking.outboundLinks) {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
                const isExternal = link.hostname !== window.location.hostname;
                const isDownload = /\.(pdf|doc|docx|xls|xlsx|zip)$/i.test(link.href);
                
                if (isExternal && !isDownload) {
                    gtag('event', 'outbound_click', {
                        event_category: 'engagement',
                        event_label: link.href,
                        destination: link.hostname
                    });
                }
            }
        });
    }
    
    // Track file downloads
    if (ANALYTICS_CONFIG.tracking.fileDownloads) {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && /\.(pdf|doc|docx|xls|xlsx|zip)$/i.test(link.href)) {
                const fileName = link.href.split('/').pop();
                gtag('event', 'file_download', {
                    event_category: 'engagement',
                    event_label: fileName,
                    file_type: fileName.split('.').pop()
                });
            }
        });
    }
}

// Export for use in other scripts
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;
