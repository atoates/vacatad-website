#!/usr/bin/env python3
"""
Script to convert old blog posts from posts.json to new standalone HTML format
"""

import json
import os
import re
import requests
from pathlib import Path
from urllib.parse import urlparse, unquote

# Paths
POSTS_JSON = '/Users/ato/vacatad.com/blog/data/posts.json'
TEMPLATE_PATH = '/Users/ato/vacatad.com/blog/posts/25-12-05-end-of-year-business-rates-strategy-maximising-relief-before-april-2026-revaluation/index.html'
POSTS_DIR = '/Users/ato/vacatad.com/blog/posts'

def load_posts():
    """Load posts from posts.json"""
    with open(POSTS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_template():
    """Load the template HTML"""
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def get_post_dir_from_slug(slug, date):
    """Get the directory name for a post"""
    # Convert date to YY-MM-DD format
    from datetime import datetime
    
    # Handle different date formats
    if isinstance(date, str):
        try:
            # Try parsing different formats
            for fmt in ['%Y-%m-%d', '%b %d, %Y', '%d %B %Y']:
                try:
                    dt = datetime.strptime(date, fmt)
                    break
                except:
                    continue
            else:
                print(f"  WARNING: Could not parse date: {date}")
                return None
        except Exception as e:
            print(f"  ERROR parsing date {date}: {e}")
            return None
    else:
        dt = datetime.fromtimestamp(date / 1000)  # Unix timestamp in milliseconds
    
    date_prefix = dt.strftime('%y-%m-%d')
    return f"{date_prefix}-{slug}"

def download_hero_image(image_url, post_dir):
    """Download hero image if it's a URL"""
    if image_url.startswith('http'):
        try:
            print(f"  Downloading hero image...")
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            hero_path = os.path.join(post_dir, 'hero.jpg')
            with open(hero_path, 'wb') as f:
                f.write(response.content)
            print(f"  ✓ Downloaded hero image")
            return 'hero.jpg'
        except Exception as e:
            print(f"  ERROR downloading image: {e}")
            return image_url
    else:
        # Already a local path
        return image_url

def format_date(date_str):
    """Format date for display"""
    from datetime import datetime
    
    try:
        for fmt in ['%Y-%m-%d', '%b %d, %Y']:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%-d %B %Y')  # e.g., "5 December 2025"
            except:
                continue
        return date_str
    except:
        return date_str

def create_post_html(post, template):
    """Create the HTML file for a post"""
    
    # Extract content and metadata
    title = post.get('title', '')
    content_html = post.get('content', '')
    excerpt = post.get('excerpt', '')
    image_alt = post.get('imageAlt', title)
    tags = post.get('tags', [])
    date_str = post.get('date', '')
    read_time = post.get('readTime', '5 min read')
    
    # Format date
    formatted_date = format_date(date_str)
    
    # Format tags HTML
    tags_html = '\n                        '.join([f'<span class="tag">{tag}</span>' for tag in tags])
    
    # Replace template placeholders
    html = template
    
    # Update title
    html = html.replace(
        '<title>End of Year Business Rates Strategy: Maximising Relief Before April 2026 Revaluation | VacatAd</title>',
        f'<title>{title} | VacatAd</title>'
    )
    
    # Update meta description
    html = html.replace(
        '<meta name="description" content="Strategic guidance for commercial landlords on maximising business rates relief before the April 2026 revaluation. Expert analysis of year-end planning, the 13-week occupation rule, and compliance strategies.">',
        f'<meta name="description" content="{excerpt}">'
    )
    
    # Update hero image alt
    html = html.replace(
        'alt="End of Year Business Rates Strategy Planning"',
        f'alt="{image_alt}"'
    )
    
    # Update article header
    html = re.sub(
        r'<h1>.*?</h1>',
        f'<h1>{title}</h1>',
        html,
        count=1,
        flags=re.DOTALL
    )
    
    # Update date
    html = html.replace(
        '<span class="date">5th December 2025</span>',
        f'<span class="date">{formatted_date}</span>'
    )
    
    # Update read time
    html = html.replace(
        '<span class="read-time">8 min read</span>',
        f'<span class="read-time">{read_time}</span>'
    )
    
    # Update tags
    html = re.sub(
        r'<div class="article-tags">.*?</div>',
        f'<div class="article-tags">\n                        {tags_html}\n                    </div>',
        html,
        count=1,
        flags=re.DOTALL
    )
    
    # Update article content
    # Find the content section and replace it
    content_start = html.find('<div class="article-content">')
    content_end = html.find('</div>\n\n        <!-- Related Articles -->')
    
    if content_start != -1 and content_end != -1:
        before = html[:content_start + len('<div class="article-content">')]
        after = html[content_end:]
        
        # Add lead paragraph wrapper if excerpt is substantial
        if len(excerpt) > 100:
            lead_para = f'\n                    <p class="lead">{excerpt}</p>\n\n                    '
        else:
            lead_para = '\n                    '
        
        html = before + lead_para + content_html + '\n        ' + after
    
    return html

def convert_post(post, template):
    """Convert a single post"""
    slug = post.get('slug', '')
    date = post.get('date', '')
    title = post.get('title', '')
    
    print(f"\n Converting: {title}")
    print(f"  Slug: {slug}")
    print(f"  Date: {date}")
    
    # Get post directory
    post_dir_name = get_post_dir_from_slug(slug, date)
    if not post_dir_name:
        print(f"  SKIPPED: Could not determine directory name")
        return False
    
    post_dir = os.path.join(POSTS_DIR, post_dir_name)
    
    # Create directory if it doesn't exist
    if not os.path.exists(post_dir):
        os.makedirs(post_dir)
        print(f"  Created directory: {post_dir_name}")
    else:
        print(f"  Using existing directory: {post_dir_name}")
    
    # Download hero image if needed
    image = post.get('image', '')
    if image:
        new_image = download_hero_image(image, post_dir)
        post['image'] = f"posts/{post_dir_name}/{new_image}" if not new_image.startswith('posts/') else new_image
    
    # Create index.html
    html_content = create_post_html(post, template)
    
    index_path = os.path.join(post_dir, 'index.html')
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"  ✓ Created index.html")
    
    # Remove content field from post
    if 'content' in post:
        del post['content']
        print(f"  ✓ Removed content field from metadata")
    
    return True

def main():
    """Main conversion process"""
    print("=" * 80)
    print("BLOG POST CONVERSION SCRIPT")
    print("=" * 80)
    
    # Load data
    print("\nLoading posts.json...")
    posts = load_posts()
    print(f"Loaded {len(posts)} posts")
    
    print("\nLoading template...")
    template = load_template()
    print("Template loaded")
    
    # Find posts with content field
    posts_to_convert = [p for p in posts if 'content' in p]
    print(f"\nFound {len(posts_to_convert)} posts with content field to convert")
    
    # Convert each post
    converted_count = 0
    failed_count = 0
    
    for post in posts_to_convert:
        try:
            if convert_post(post, template):
                converted_count += 1
            else:
                failed_count += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            failed_count += 1
    
    # Save updated posts.json
    print("\n" + "=" * 80)
    print("Saving updated posts.json...")
    with open(POSTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print("✓ posts.json updated")
    
    # Summary
    print("\n" + "=" * 80)
    print("CONVERSION SUMMARY")
    print("=" * 80)
    print(f"Successfully converted: {converted_count}")
    print(f"Failed: {failed_count}")
    print(f"Total processed: {converted_count + failed_count}")
    
    if converted_count > 0:
        print("\n✓ Conversion complete!")
        print("\nConverted post slugs:")
        for post in posts_to_convert[:converted_count]:
            print(f"  - {post.get('slug', 'unknown')}")
    
    if failed_count > 0:
        print(f"\n⚠ {failed_count} posts failed to convert. Check the output above for details.")

if __name__ == '__main__':
    main()
