#!/usr/bin/env python3
"""
Script to rename blog post folders to start with their publication date.
Format: YY-MM-DD-slug (e.g., 25-10-2-business-rates-forward-look...)
"""

import json
import os
import shutil
import re
from pathlib import Path

# Paths
BLOG_DIR = Path("blog")
POSTS_DIR = BLOG_DIR / "posts"
DATA_DIR = BLOG_DIR / "data"

def parse_date(date_str):
    """Parse date string like 'Oct 2, 2025' to (year, month, day)."""
    month_map = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    }
    
    # Parse format like "Oct 2, 2025"
    parts = date_str.replace(',', '').split()
    if len(parts) == 3:
        month = month_map.get(parts[0], '01')
        day = parts[1].zfill(2)
        year = parts[2]
        return f"{year[-2:]}-{month}-{day}"  # YY-MM-DD format
    return None

def rename_folders():
    """Main function to rename blog post folders."""
    # Load posts.json
    posts_file = DATA_DIR / "posts.json"
    with open(posts_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    print(f"Found {len(posts)} blog posts to rename\n")
    
    # Create mapping of old slug to new folder name
    folder_mapping = {}
    
    for post in posts:
        slug = post['slug']
        date_str = post['date']
        date_prefix = parse_date(date_str)
        
        if not date_prefix:
            print(f"⚠️  Warning: Could not parse date '{date_str}' for {slug}")
            continue
        
        old_folder = POSTS_DIR / slug
        new_folder_name = f"{date_prefix}-{slug}"
        new_folder = POSTS_DIR / new_folder_name
        
        folder_mapping[slug] = {
            'old': old_folder,
            'new': new_folder,
            'new_name': new_folder_name,
            'date_prefix': date_prefix
        }
        
        print(f"{slug}")
        print(f"  Date: {date_str} -> {date_prefix}")
        print(f"  Old: {old_folder.name}")
        print(f"  New: {new_folder_name}")
        print()
    
    # Rename folders
    print("Renaming folders...\n")
    for slug, mapping in folder_mapping.items():
        old_folder = mapping['old']
        new_folder = mapping['new']
        
        if not old_folder.exists():
            print(f"⚠️  Warning: {old_folder} does not exist, skipping...")
            continue
        
        if new_folder.exists():
            print(f"⚠️  Warning: {new_folder} already exists, skipping...")
            continue
        
        # Rename the folder
        old_folder.rename(new_folder)
        print(f"✅ Renamed: {old_folder.name} -> {new_folder.name}")
        
        # Update posts.json entry
        post = next((p for p in posts if p['slug'] == slug), None)
        if post:
            # Update image path
            if 'image' in post and post['image']:
                old_image_path = post['image']
                # Replace old slug with new folder name in image path
                new_image_path = old_image_path.replace(f"posts/{slug}/", f"posts/{mapping['new_name']}/")
                post['image'] = new_image_path
            
            # Keep slug the same for URL purposes, but folder is renamed
    
    # Save updated posts.json
    with open(posts_file, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Updated {posts_file}")
    
    # Update all HTML files to reference new folder paths
    print("\nUpdating HTML files...\n")
    for slug, mapping in folder_mapping.items():
        new_folder = mapping['new']
        index_file = new_folder / "index.html"
        
        if not index_file.exists():
            continue
        
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update canonical URLs and social sharing URLs
        old_url = f"blog/posts/{slug}"
        new_url = f"blog/posts/{mapping['new_name']}"
        
        content = re.sub(
            rf'https://vacatad\.com/blog/posts/{re.escape(slug)}(/|\.html)',
            f'https://vacatad.com/blog/posts/{mapping["new_name"]}/',
            content
        )
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Updated URLs in: {index_file}")
    
    # Update blog/index.html to use new folder paths
    blog_index = BLOG_DIR / "index.html"
    with open(blog_index, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The JavaScript already uses post.slug, so we need to update the image paths
    # But actually, the posts.json already has the correct image paths now
    # So blog/index.html should work as-is since it reads from posts.json
    
    print("\n🎉 Blog folder renaming complete!")
    print(f"\nRenamed {len(folder_mapping)} folders with date prefixes.")

if __name__ == "__main__":
    rename_folders()


