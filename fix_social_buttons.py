#!/usr/bin/env python3
"""
Fix social share button visibility:
- Make icons white by default
- Turn light green (tea-green) on hover
"""

import os
import re
from pathlib import Path

def fix_article(file_path):
    """Fix a single blog article file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Find and replace the social button styles
    # Pattern to match all three social button styles
    pattern = r'(\.share-twitter\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*)var\(--tea-green\)(\s*;\s*})'
    replacement = r'\1white\2\n        \n        .share-twitter:hover {\n            color: var(--tea-green);\n        }'
    content = re.sub(pattern, replacement, content)
    
    pattern = r'(\.share-linkedin\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*)var\(--tea-green\)(\s*;\s*})'
    replacement = r'\1white\2\n        \n        .share-linkedin:hover {\n            color: var(--tea-green);\n        }'
    content = re.sub(pattern, replacement, content)
    
    pattern = r'(\.share-facebook\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*)var\(--tea-green\)(\s*;\s*})'
    replacement = r'\1white\2\n        \n        .share-facebook:hover {\n            color: var(--tea-green);\n        }'
    content = re.sub(pattern, replacement, content)
    
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
