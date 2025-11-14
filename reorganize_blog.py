#!/usr/bin/env python3
"""
Script to reorganize blog posts into individual folders with their images.
Each post gets its own folder with:
- index.html (the post HTML file)
- image1.png/webp (banner image)
- image2.png/webp, image3.png/webp, etc. (other images)
"""

import json
import os
import shutil
import re
from pathlib import Path

# Paths
BLOG_DIR = Path("blog")
POSTS_DIR = BLOG_DIR / "posts"
IMAGES_DIR = BLOG_DIR / "images"
DATA_DIR = BLOG_DIR / "data"

def get_image_extension(filename):
    """Extract file extension from filename."""
    return Path(filename).suffix

def find_image_in_html(html_content, images_dir):
    """Find all image references in HTML content."""
    images = []
    # Find img src attributes
    img_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
    for match in re.finditer(img_pattern, html_content):
        src = match.group(1)
        # Skip data URIs and external URLs
        if src.startswith('data:') or src.startswith('http'):
            continue
        # Convert relative paths
        if src.startswith('../images/'):
            img_name = src.replace('../images/', '')
            img_path = images_dir / img_name
            if img_path.exists():
                images.append(str(img_path))
        elif src.startswith('../../assets/'):
            # Skip assets folder images
            continue
    return images

def reorganize_blog():
    """Main function to reorganize blog structure."""
    # Load posts.json
    posts_file = DATA_DIR / "posts.json"
    with open(posts_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    print(f"Found {len(posts)} blog posts to reorganize\n")
    
    # Process each post
    for post in posts:
        slug = post['slug']
        current_html = POSTS_DIR / f"{slug}.html"
        
        if not current_html.exists():
            print(f"⚠️  Warning: {current_html} not found, skipping...")
            continue
        
        print(f"Processing: {post['title']}")
        print(f"  Slug: {slug}")
        
        # Create folder for this post
        post_folder = POSTS_DIR / slug
        post_folder.mkdir(exist_ok=True)
        print(f"  Created folder: {post_folder}")
        
        # Read HTML content
        with open(current_html, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Find banner image from posts.json
        banner_image_path = None
        if 'image' in post and post['image']:
            banner_src = post['image'].replace('../images/', '')
            banner_image_path = IMAGES_DIR / banner_src
            if banner_image_path.exists():
                # Copy banner as image1
                ext = get_image_extension(banner_image_path)
                image1_path = post_folder / f"image1{ext}"
                shutil.copy2(banner_image_path, image1_path)
                print(f"  Copied banner image to: {image1_path.name}")
                
                # Update HTML to reference image1
                old_banner_ref = post['image'].replace('../images/', '../images/')
                html_content = html_content.replace(
                    f'src="{old_banner_ref}"',
                    f'src="image1{ext}"'
                )
                html_content = html_content.replace(
                    f'src=\'{old_banner_ref}\'',
                    f'src=\'image1{ext}\''
                )
                # Also update in meta tags
                html_content = re.sub(
                    r'content="https://vacatad\.com/blog/images/[^"]*"',
                    f'content="https://vacatad.com/blog/posts/{slug}/image1{ext}"',
                    html_content
                )
            else:
                print(f"  ⚠️  Warning: Banner image {banner_image_path} not found")
        
        # Find all other images in HTML
        other_images = find_image_in_html(html_content, IMAGES_DIR)
        image_counter = 2  # Start from image2 (image1 is banner)
        
        for img_path_str in other_images:
            img_path = Path(img_path_str)
            if img_path.exists() and img_path != banner_image_path:
                ext = get_image_extension(img_path)
                new_image_name = f"image{image_counter}{ext}"
                new_image_path = post_folder / new_image_name
                shutil.copy2(img_path, new_image_path)
                print(f"  Copied image to: {new_image_name}")
                
                # Update HTML reference
                old_ref = f"../images/{img_path.name}"
                html_content = html_content.replace(
                    f'src="{old_ref}"',
                    f'src="{new_image_name}"'
                )
                html_content = html_content.replace(
                    f'src=\'{old_ref}\'',
                    f'src=\'{new_image_name}\''
                )
                
                image_counter += 1
        
        # Update all relative paths in HTML (for assets, css, etc.)
        # Update paths going up two levels to three levels
        html_content = html_content.replace('../../css/', '../../../css/')
        html_content = html_content.replace('../../assets/', '../../../assets/')
        html_content = html_content.replace('../../js/', '../../../js/')
        html_content = html_content.replace('../../index.html', '../../../index.html')
        html_content = html_content.replace('../../faqs.html', '../../../faqs.html')
        html_content = html_content.replace('../../contact.html', '../../../contact.html')
        html_content = html_content.replace('../index.html', '../../../index.html')
        
        # Write index.html to post folder
        index_html = post_folder / "index.html"
        with open(index_html, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"  Created: {index_html}")
        
        # Delete old HTML file
        current_html.unlink()
        print(f"  Deleted old file: {current_html.name}")
        
        # Update posts.json entry
        ext = get_image_extension(banner_image_path) if banner_image_path and banner_image_path.exists() else '.webp'
        post['image'] = f"posts/{slug}/image1{ext}"
        post['slug'] = slug  # Keep slug the same, but path will be posts/{slug}/index.html
        
        print(f"  ✅ Completed\n")
    
    # Save updated posts.json
    with open(posts_file, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"✅ Updated {posts_file}")
    
    print("\n🎉 Blog reorganization complete!")

if __name__ == "__main__":
    reorganize_blog()


