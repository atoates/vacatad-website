#!/usr/bin/env python3
"""
Fix social share button visibility:
- Make icons white by default with !important
- Turn light green (tea-green) on hover
- Add fill: currentColor to SVG
"""

import os
import re
from pathlib import Path

def fix_article(file_path):
    """Fix a single blog article file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # First, add fill: currentColor to .share-btn svg if not already present
    if 'fill: currentColor;' not in content:
        pattern = r'(\.share-btn svg\s*{\s*width:\s*20px;\s*height:\s*20px;)\s*}'
        replacement = r'\1\n            fill: currentColor;\n        }'
        content = re.sub(pattern, replacement, content)
    
    # Fix Twitter button - add !important to color
    pattern = r'\.share-twitter\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*white;\s*}'
    replacement = '.share-twitter {\n            background: var(--eerie-black);\n            color: white !important;\n        }'
    content = re.sub(pattern, replacement, content)
    
    pattern = r'\.share-twitter:hover\s*{\s*color:\s*var\(--tea-green\);\s*}'
    replacement = '.share-twitter:hover {\n            color: var(--tea-green) !important;\n        }'
    content = re.sub(pattern, replacement, content)
    
    # Fix LinkedIn button - add !important to color
    pattern = r'\.share-linkedin\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*white;\s*}'
    replacement = '.share-linkedin {\n            background: var(--eerie-black);\n            color: white !important;\n        }'
    content = re.sub(pattern, replacement, content)
    
    pattern = r'\.share-linkedin:hover\s*{\s*color:\s*var\(--tea-green\);\s*}'
    replacement = '.share-linkedin:hover {\n            color: var(--tea-green) !important;\n        }'
    content = re.sub(pattern, replacement, content)
    
    # Fix Facebook button - add !important to color
    pattern = r'\.share-facebook\s*{\s*background:\s*var\(--eerie-black\);\s*color:\s*white;\s*}'
    replacement = '.share-facebook {\n            background: var(--eerie-black);\n            color: white !important;\n        }'
    content = re.sub(pattern, replacement, content)
    
    pattern = r'\.share-facebook:hover\s*{\s*color:\s*var\(--tea-green\);\s*}'
    replacement = '.share-facebook:hover {\n            color: var(--tea-green) !important;\n        }'
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
