#!/usr/bin/env python3
"""
Script to update all blog post HTML files with new template structure
"""

import json
import re
from pathlib import Path

# Load posts data
with open('blog/data/posts.json', 'r', encoding='utf-8') as f:
    posts = json.load(f)

# Get all blog post HTML files
blog_posts_dir = Path('blog/posts')
html_files = list(blog_posts_dir.glob('*.html'))

print(f"Found {len(html_files)} blog post HTML files")

# CSS updates needed
css_replacements = [
    # Hero section - from dark header to banner image only
    (
        r'\.post-hero\s*{[^}]+}',
        '''.post-hero {
            width: 100%;
            max-height: 500px;
            overflow: hidden;
            position: relative;
        }
        
        .post-hero img {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
            max-height: 500px;
        }'''
    ),
    # Update post-header CSS
    (
        r'\.post-header\s*{[^}]+}',
        '''.post-header {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem 0;
        }'''
    ),
    # Remove old post-category, update post-title
    (
        r'\.post-category\s*{[^}]+}',
        ''
    ),
    # Update post-title
    (
        r'\.post-title\s*{[^}]+}',
        '''.post-title {
            font-size: clamp(2rem, 5vw, 3rem);
            margin-bottom: 1rem;
            line-height: 1.2;
            color: var(--eerie-black);
        }'''
    ),
    # Update post-meta
    (
        r'\.post-meta\s*{[^}]+}',
        '''.post-meta {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.95rem;
            color: var(--grey-text);
            padding-bottom: 2rem;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 2rem;
        }
        
        .post-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }'''
    ),
    # Remove old post-image CSS (we don't need it anymore)
    (
        r'\.post-image\s*{[^}]+}\s*\.post-image\s+img\s*{[^}]+}',
        ''
    ),
    # Update post-content padding
    (
        r'(\.post-content\s*{[^}]*padding:\s*)[^;]+(;[^}]*})',
        r'\g<1>0 1rem 3rem\g<2>'
    ),
    # Add link styling for post-content
    (
        r'(\.post-content\s+strong\s*{[^}]+})',
        r'''\g<1>
        
        .post-content a {
            color: var(--eerie-black);
            text-decoration: underline;
            transition: color 0.3s ease;
        }
        
        .post-content a:hover {
            color: var(--tea-green);
        }'''
    ),
    # Update back-to-blog styling
    (
        r'\.back-to-blog\s*{[^}]+}\s*\.back-to-blog:hover\s*{[^}]+}',
        '''.back-to-blog {
            display: inline-block;
            padding: 0.5rem 1.25rem;
            background: var(--eerie-black);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
            border: 2px solid var(--eerie-black);
        }
        
        .back-to-blog:hover {
            background: white;
            color: var(--eerie-black);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }'''
    ),
    # Add CTA button styling
    (
        r'(\.cta-box\s+p\s*{[^}]+})',
        r'''\g<1>
        
        .cta-button {
            display: inline-block;
            padding: 1rem 2rem;
            background: var(--eerie-black);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid var(--eerie-black);
        }
        
        .cta-button:hover {
            background: white;
            color: var(--eerie-black);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }'''
    ),
    # Update share buttons to icon-only
    (
        r'\.share-buttons\s*{[^}]+}\s*\.share-btn\s*{[^}]+}\s*\.share-btn:hover\s*{[^}]+}\s*\.share-twitter\s*{[^}]+}\s*\.share-linkedin\s*{[^}]+}\s*\.share-facebook\s*{[^}]+}',
        '''.share-buttons {
            display: flex;
            gap: 1rem;
            align-items: center;
            margin: 2rem 0;
            padding-top: 2rem;
            border-top: 1px solid #e0e0e0;
        }
        
        .share-label {
            font-weight: 600;
            color: var(--eerie-black);
            margin-right: 0.5rem;
        }
        
        .share-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .share-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .share-btn svg {
            width: 20px;
            height: 20px;
        }
        
        .share-twitter {
            background: #1DA1F2;
            color: white;
        }
        
        .share-linkedin {
            background: #0077B5;
            color: white;
        }
        
        .share-facebook {
            background: #1877F2;
            color: white;
        }'''
    ),
]

# HTML structure updates
def update_html_structure(html_content, post_data):
    """Update HTML structure for a blog post"""
    
    # 1. Update logo to circular favicon
    html_content = html_content.replace(
        'src="../../assets/images/asset-8.webp" alt="VacatAd Logo" class="logo-icon" width="223" height="191"',
        'src="../../assets/favicon.svg" alt="VacatAd Logo" class="logo-icon" width="32" height="32" style="border-radius: 50%;"'
    )
    
    # 2. Find and replace hero section
    # Match the entire hero section and featured image section
    hero_pattern = r'<!-- Post Hero -->.*?</section>\s*<!-- Featured Image -->.*?</div>\s*</div>'
    
    image_path = post_data['image'].replace('../', '../../')
    image_alt = post_data['imageAlt']
    
    new_hero = f'''<!-- Hero Banner Image -->
        <section class="post-hero">
            <img src="{image_path}" alt="{image_alt}" loading="eager">
        </section>'''
    
    html_content = re.sub(hero_pattern, new_hero, html_content, flags=re.DOTALL)
    
    # 3. Update post header structure
    title = post_data['title']
    author = post_data['author']['name']
    date = post_data['date']
    read_time = post_data['readTime']
    
    # Find the back-to-blog link and replace the section
    post_content_pattern = r'<!-- Post Content -->.*?<a href="\.\./index\.html" class="back-to-blog">.*?</a>'
    
    new_header = f'''<!-- Post Header -->
        <div class="container">
            <div class="post-header">
                <a href="../index.html" class="back-to-blog">← Back to Blog</a>
                
                <h1 class="post-title">{title}</h1>
                
                <div class="post-meta">
                    <span class="post-meta-item">By {author}</span>
                    <span>•</span>
                    <span class="post-meta-item">{date}</span>
                    <span>•</span>
                    <span class="post-meta-item">{read_time}</span>
                </div>
            </div>
        </div>

        <!-- Post Content -->
        <article class="post-content">
            <div class="container">'''
    
    html_content = re.sub(post_content_pattern, new_header, html_content, flags=re.DOTALL)
    
    # 4. Update share buttons to icon-only with CTA
    share_pattern = r'<!-- Share Buttons -->.*?</div>'
    
    slug = post_data['slug']
    encoded_title = post_data['title'].replace(' ', '%20').replace("'", "%27")
    post_url = f'https://vacatad.com/blog/posts/{slug}.html'
    
    new_share = f'''<!-- Contact CTA -->
                <div class="cta-box">
                    <h3>Ready to Reduce Your Business Rates?</h3>
                    <p>Speak with our team to learn how VacatAd can help you legally reduce your business rates liability.</p>
                    <a href="../../contact.html" class="cta-button">Get in Touch</a>
                </div>

                <!-- Share Buttons -->
                <div class="share-buttons">
                    <span class="share-label">Share:</span>
                    <a href="https://twitter.com/intent/tweet?text={encoded_title}&url={post_url}" target="_blank" rel="noopener" class="share-btn share-twitter" aria-label="Share on Twitter">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url={post_url}" target="_blank" rel="noopener" class="share-btn share-linkedin" aria-label="Share on LinkedIn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u={post_url}" target="_blank" rel="noopener" class="share-btn share-facebook" aria-label="Share on Facebook">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                </div>'''
    
    html_content = re.sub(share_pattern, new_share, html_content, flags=re.DOTALL)
    
    return html_content

# Process each file
for html_file in html_files:
    print(f"\nProcessing: {html_file.name}")
    
    # Find matching post data
    slug = html_file.stem
    post_data = next((p for p in posts if p['slug'] == slug), None)
    
    if not post_data:
        print(f"  ⚠️  No matching post data found in posts.json")
        continue
    
    # Read HTML file
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Apply CSS replacements
    for pattern, replacement in css_replacements:
        html_content = re.sub(pattern, replacement, html_content, flags=re.DOTALL)
    
    # Apply HTML structure updates
    html_content = update_html_structure(html_content, post_data)
    
    # Write updated HTML back to file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"  ✅ Updated successfully")

print(f"\n✅ All {len(html_files)} blog posts updated!")
print("\nChanges made:")
print("1. Hero section now shows only banner image (no text)")
print("2. Title and meta info moved below banner")
print("3. Back to blog button styled as proper button")
print("4. Added contact CTA button before share buttons")
print("5. Share buttons converted to icon-only circular design")
print("6. Logo updated to circular favicon")
print("7. Link colors updated to match brand (dark with green hover)")
