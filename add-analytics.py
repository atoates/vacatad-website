#!/usr/bin/env python3
"""
Add Google Analytics to all HTML files
"""

import os
import re

MEASUREMENT_ID = "G-DEZQKBTTFH"

# Google Analytics code to insert
GA_CODE = f"""
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', '{MEASUREMENT_ID}', {{
      'send_page_view': true,
      'cookie_flags': 'SameSite=None;Secure'
    }});
  </script>
"""

def add_analytics_to_file(filepath):
    """Add Google Analytics to a single HTML file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has analytics
        if 'googletagmanager.com/gtag/js' in content or MEASUREMENT_ID in content:
            print(f"✅ Already has analytics: {filepath}")
            return False
        
        # Skip if not an HTML file with proper structure
        if '</head>' not in content:
            print(f"⏭️  Skipped (no </head> tag): {filepath}")
            return False
        
        # Insert before </head>
        updated_content = content.replace('</head>', GA_CODE + '</head>')
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Added analytics to: {filepath}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    """Add analytics to all HTML files"""
    
    # Root HTML files
    html_files = [
        'contact.html',
        'privacy.html',
        'terms.html',
        'faqs.html',
        'affiliate-program.html',
        'local.html'
    ]
    
    # Blog files
    blog_index = 'blog/index.html'
    if os.path.exists(blog_index):
        html_files.append(blog_index)
    
    # Blog posts
    blog_posts_dir = 'blog/posts'
    if os.path.exists(blog_posts_dir):
        for filename in os.listdir(blog_posts_dir):
            if filename.endswith('.html'):
                html_files.append(os.path.join(blog_posts_dir, filename))
    
    print(f"🔍 Found {len(html_files)} HTML files to process\n")
    
    added_count = 0
    for filepath in html_files:
        if os.path.exists(filepath):
            if add_analytics_to_file(filepath):
                added_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
    
    print(f"\n✅ Added Google Analytics to {added_count} files")
    print(f"📊 Measurement ID: {MEASUREMENT_ID}")

if __name__ == "__main__":
    main()
