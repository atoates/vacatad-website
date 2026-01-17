#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for VacatAd Website
 * 
 * This script generates a complete sitemap.xml file including:
 * - Static HTML pages
 * - Blog index page
 * - All blog posts from posts.json
 * 
 * Usage: node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://vacatad.com';
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');
const BLOG_POSTS_JSON = path.join(__dirname, 'blog/data/posts.json');

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
    {
        loc: '/',
        lastmod: '2025-10-15',
        changefreq: 'weekly',
        priority: 1.0
    },
    {
        loc: '/faqs.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.8
    },
    {
        loc: '/contact.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.9
    },
    {
        loc: '/blog/',
        lastmod: '2025-10-15',
        changefreq: 'weekly',
        priority: 0.7
    },
    {
        loc: '/local.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.8
    },
    {
        loc: '/affiliate-program.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.6
    },
    {
        loc: '/privacy.html',
        lastmod: '2025-10-15',
        changefreq: 'yearly',
        priority: 0.3
    },
    {
        loc: '/terms.html',
        lastmod: '2025-10-15',
        changefreq: 'yearly',
        priority: 0.3
    },
    {
        loc: '/gdpr.html',
        lastmod: '2025-10-24',
        changefreq: 'yearly',
        priority: 0.3
    },
    {
        loc: '/router-dashboard.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.8
    },
    {
        loc: '/how-we-work.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.9
    },
    {
        loc: '/the-team.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.5
    },
    {
        loc: '/city/london.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/manchester.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/birmingham.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/leeds.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/liverpool.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/bristol.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/sheffield.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
    },
    {
    },
    {
        loc: '/city/newcastle.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/nottingham.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/leicester.html',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.7
    },
    {
        loc: '/city/',
        lastmod: '2025-10-15',
        changefreq: 'monthly',
        priority: 0.8
    }
];

/**
 * Parse date string from blog posts and convert to ISO format
 * @param {string} dateStr - Date in format "MMM DD, YYYY"
 * @returns {string} ISO date string
 */
function parsePostDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn(`Warning: Could not parse date "${dateStr}"`);
    }
    // Fallback to current date if parsing fails
    return new Date().toISOString().split('T')[0];
}

/**
 * Generate sitemap XML content
 * @returns {string} Complete sitemap XML
 */
function generateSitemap() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    STATIC_PAGES.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    // Read and add blog posts
    try {
        const postsData = fs.readFileSync(BLOG_POSTS_JSON, 'utf8');
        const posts = JSON.parse(postsData);

        console.log(`Found ${posts.length} blog posts`);

        posts.forEach(post => {
            // Extract folder name from image path (posts/YY-MM-DD-slug/hero.jpg -> YY-MM-DD-slug)
            const folderName = post.image.split('/')[1];
            const postUrl = `/blog/posts/${folderName}/`;
            const lastmod = parsePostDate(post.date);
            
            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}${postUrl}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += `    <priority>${post.featured ? 0.7 : 0.6}</priority>\n`;
            xml += '  </url>\n';
        });
    } catch (error) {
        console.error('Error reading blog posts:', error.message);
        console.error('Continuing without blog posts...');
    }

    xml += '</urlset>\n';
    return xml;
}

/**
 * Main execution
 */
function main() {
    console.log('🗺️  Generating sitemap...');
    
    try {
        const sitemapContent = generateSitemap();
        fs.writeFileSync(OUTPUT_FILE, sitemapContent, 'utf8');
        
        console.log('✅ Sitemap generated successfully!');
        console.log(`📍 Location: ${OUTPUT_FILE}`);
        
        // Count URLs
        const urlCount = (sitemapContent.match(/<url>/g) || []).length;
        console.log(`📊 Total URLs: ${urlCount}`);
        
    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { generateSitemap, parsePostDate };
