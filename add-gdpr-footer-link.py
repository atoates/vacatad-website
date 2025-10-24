#!/usr/bin/env python3
"""
Add GDPR Policy link to footer Legal sections across all HTML files
"""

import os
import re

def update_footer_legal_section(filepath, is_blog=False):
    """Update footer legal section to include GDPR link"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Determine the correct path prefix based on location
        gdpr_link = '../gdpr.html' if is_blog else 'gdpr.html'
        
        # Pattern to match the Legal footer section
        # Match variations of the legal section structure
        pattern1 = r'(<li><a href="[./]*privacy\.html">Privacy Policy</a></li>\s*<li><a href="[./]*terms\.html">Terms.*?</a></li>)(\s*</ul>)'
        replacement1 = r'\1\n                        <li><a href="' + gdpr_link + r'">GDPR Policy</a></li>\2'
        
        # Alternative pattern for different footer structure
        pattern2 = r'(<li><a href="[./]*privacy\.html">Privacy Policy</a></li>\s*<li><a href="[./]*terms\.html">Terms.*?</a></li>\s*<li><a href="[./]*faqs\.html">FAQs</a></li>)'
        replacement2 = r'<li><a href="' + ('../privacy.html' if is_blog else 'privacy.html') + r'">Privacy Policy</a></li>\n                        <li><a href="' + ('../terms.html' if is_blog else 'terms.html') + r'">Terms of Service</a></li>\n                        <li><a href="' + gdpr_link + r'">GDPR Policy</a></li>\n                        <li><a href="' + ('../faqs.html' if is_blog else 'faqs.html') + r'">FAQs</a></li>'
        
        # Check if GDPR link already exists
        if 'gdpr.html' in content:
            print(f"⏭️  Already has GDPR link: {filepath}")
            return False
        
        # Try first pattern
        updated_content, count1 = re.subn(pattern1, replacement1, content, count=1)
        
        if count1 > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated (pattern 1): {filepath}")
            return True
        
        # Try second pattern
        updated_content, count2 = re.subn(pattern2, replacement2, content, count=1)
        
        if count2 > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated (pattern 2): {filepath}")
            return True
        
        print(f"⚠️  No matching footer pattern: {filepath}")
        return False
        
    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    """Update all HTML files with GDPR footer link"""
    
    # Root HTML files
    root_files = [
        'contact.html',
        'privacy.html',
        'terms.html',
        'faqs.html',
        'affiliate-program.html',
        'local.html',
        'gdpr.html'
    ]
    
    # Blog files
    blog_files = ['blog/index.html']
    
    # Blog posts
    blog_posts_dir = 'blog/posts'
    if os.path.exists(blog_posts_dir):
        for filename in os.listdir(blog_posts_dir):
            if filename.endswith('.html'):
                blog_files.append(os.path.join(blog_posts_dir, filename))
    
    print("🔧 Updating footer Legal sections with GDPR link\n")
    
    updated_count = 0
    
    # Update root files
    for filepath in root_files:
        if os.path.exists(filepath):
            if update_footer_legal_section(filepath, is_blog=False):
                updated_count += 1
    
    # Update blog files
    for filepath in blog_files:
        if os.path.exists(filepath):
            if update_footer_legal_section(filepath, is_blog=True):
                updated_count += 1
    
    print(f"\n✅ Updated {updated_count} files with GDPR footer link")

if __name__ == "__main__":
    main()
