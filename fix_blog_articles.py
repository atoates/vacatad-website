#!/usr/bin/env python3
"""
Fix blog article footer issues:
1. Make CTA button visible with proper styling
2. Update social icons to use theme colors
3. Replace 'V' avatar with logo image
"""

import os
import re
from pathlib import Path

def fix_article(file_path):
    """Fix a single blog article file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Fix CTA button - change background to tea-green for visibility
    # Replace the .cta-button CSS (both instances if duplicated)
    content = re.sub(
        r'(\.cta-button\s*{[^}]*?background:\s*)var\(--eerie-black\)',
        r'\1var(--tea-green)',
        content
    )
    
    # Also update hover state
    content = re.sub(
        r'(\.cta-button:hover\s*{[^}]*?background:\s*)white',
        r'\1var(--eerie-black)',
        content
    )
    content = re.sub(
        r'(\.cta-button:hover\s*{[^}]*?color:\s*)var\(--eerie-black\)',
        r'\1white',
        content
    )
    
    # 2. Fix social icons - use theme colors instead of brand colors
    # Update Twitter/X icon
    content = re.sub(
        r'\.share-twitter\s*{[^}]*?}',
        '.share-twitter {\n            background: var(--eerie-black);\n            color: var(--tea-green);\n        }',
        content
    )
    
    # Update LinkedIn icon
    content = re.sub(
        r'\.share-linkedin\s*{[^}]*?}',
        '.share-linkedin {\n            background: var(--eerie-black);\n            color: var(--tea-green);\n        }',
        content
    )
    
    # Update Facebook icon
    content = re.sub(
        r'\.share-facebook\s*{[^}]*?}',
        '.share-facebook {\n            background: var(--eerie-black);\n            color: var(--tea-green);\n        }',
        content
    )
    
    # 3. Replace 'V' avatar with logo image
    content = re.sub(
        r'<div class="author-avatar">V</div>',
        '<div class="author-avatar"><img src="../../assets/images/asset-8.webp" alt="VacatAd Logo" style="width: 100%; height: 100%; object-fit: contain; padding: 5px;"></div>',
        content
    )
    
    # 4. Update author-avatar CSS to remove background and be more flexible
    content = re.sub(
        r'(\.author-avatar\s*{[^}]*?)background:\s*var\(--tea-green\);',
        r'\1background: white;',
        content
    )
    
    # Write back if changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    blog_posts_dir = Path('blog/posts')
    
    if not blog_posts_dir.exists():
        print(f"Error: {blog_posts_dir} not found")
        return
    
    fixed_count = 0
    for html_file in blog_posts_dir.glob('*.html'):
        if fix_article(html_file):
            print(f"✓ Fixed: {html_file.name}")
            fixed_count += 1
        else:
            print(f"- No changes: {html_file.name}")
    
    print(f"\n✅ Fixed {fixed_count} blog article(s)")

if __name__ == '__main__':
    main()
