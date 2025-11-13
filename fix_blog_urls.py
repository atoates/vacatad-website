#!/usr/bin/env python3
"""
Script to fix URLs in blog post HTML files to remove .html extension
since posts are now in folders with index.html
"""

import os
import re
from pathlib import Path

POSTS_DIR = Path("blog/posts")

def fix_urls_in_file(file_path):
    """Fix URLs in a single HTML file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get the slug from the folder name
    slug = file_path.parent.name
    
    # Replace .html with / in URLs
    old_url = f"blog/posts/{slug}.html"
    new_url = f"blog/posts/{slug}/"
    
    content = content.replace(old_url, new_url)
    
    # Also fix canonical and meta tags
    content = re.sub(
        r'https://vacatad\.com/blog/posts/([^/]+)\.html',
        r'https://vacatad.com/blog/posts/\1/',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed URLs in: {file_path}")

def main():
    """Main function."""
    for post_folder in POSTS_DIR.iterdir():
        if post_folder.is_dir():
            index_file = post_folder / "index.html"
            if index_file.exists():
                fix_urls_in_file(index_file)

if __name__ == "__main__":
    main()

