#!/usr/bin/env python3
"""
Blog Posts Batch Update Script
Updates all blog posts with:
1. CSS version to v=20251015
2. Theme color meta tag
3. Ensures OG and Twitter URLs match canonical URLs
"""

import os
import re
import json
from pathlib import Path

# Configuration
BLOG_POSTS_DIR = Path("blog/posts")
POSTS_JSON = Path("blog/data/posts.json")
CSS_VERSION = "20251015"
THEME_COLOR = "#232523"

def load_posts_data():
    """Load blog posts metadata from JSON"""
    with open(POSTS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_blog_post(filepath, slug):
    """Update a single blog post file"""
    print(f"Updating {filepath.name}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Update CSS version
    content = re.sub(
        r'css/styles\.css\?v=\d+m?',
        f'css/styles.css?v={CSS_VERSION}',
        content
    )
    
    # 2. Add theme-color if missing (after CSS link, before Favicon)
    if 'name="theme-color"' not in content:
        content = re.sub(
            r'(<!-- CSS -->.*?css/styles\.css\?v=\d+">)\s*(<!-- Favicon -->)',
            rf'\1\n    \n    <!-- Theme Color -->\n    <meta name="theme-color" content="{THEME_COLOR}">\n    \n    \2',
            content,
            flags=re.DOTALL
        )
    
    # 3. Fix OG and Twitter URLs to match slug
    correct_url = f"https://vacatad.com/blog/posts/{slug}.html"
    
    # Fix og:url
    content = re.sub(
        r'<meta property="og:url" content="https://vacatad\.com/blog/posts/[^"]+\.html">',
        f'<meta property="og:url" content="{correct_url}">',
        content
    )
    
    # Fix twitter:url  
    content = re.sub(
        r'<meta property="twitter:url" content="https://vacatad\.com/blog/posts/[^"]+\.html">',
        f'<meta property="twitter:url" content="{correct_url}">',
        content
    )
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Updated {filepath.name}")
        return True
    else:
        print(f"  ⏭️  No changes needed for {filepath.name}")
        return False

def main():
    """Main execution"""
    print("🔧 Blog Posts Batch Update Script")
    print("=" * 50)
    
    # Load posts data
    posts = load_posts_data()
    print(f"Found {len(posts)} posts in posts.json\n")
    
    # Track updates
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    # Update each post
    for post in posts:
        slug = post['slug']
        filepath = BLOG_POSTS_DIR / f"{slug}.html"
        
        if not filepath.exists():
            print(f"⚠️  File not found: {filepath}")
            error_count += 1
            continue
        
        try:
            if update_blog_post(filepath, slug):
                updated_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"❌ Error updating {filepath.name}: {e}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Update Summary:")
    print(f"  ✅ Updated: {updated_count}")
    print(f"  ⏭️  Skipped: {skipped_count}")
    print(f"  ❌ Errors: {error_count}")
    print(f"  📄 Total: {len(posts)}")
    print("=" * 50)

if __name__ == "__main__":
    main()
