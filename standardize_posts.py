import json
import re
from bs4 import BeautifulSoup, Comment

def standardize_posts():
    json_path = 'blog/data/posts.json'
    with open(json_path, 'r') as f:
        posts = json.load(f)

    print(f"Processing {len(posts)} posts...")
    
    for post in posts:
        soup = BeautifulSoup(post['content'], 'html.parser')
        
        # 1. Remove Comments
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()

        # 2. Remove Author Info (will be handled by template)
        for author_div in soup.find_all('div', class_='author-info'):
            author_div.decompose()

        # 3. Remove Empty Paragraphs
        for p in soup.find_all('p'):
            if not p.get_text(strip=True) and not p.find('img') and not p.find('iframe'):
                p.decompose()

        # 4. Standardize Images
        for img in soup.find_all('img'):
            # Remove inline styles
            if img.has_attr('style'):
                del img['style']
            
            # Add class
            classes = img.get('class')
            if classes is None:
                classes = []
            elif isinstance(classes, str):
                classes = [classes]
            
            if 'article-image' not in classes:
                classes.append('article-image')
            img['class'] = classes
            
            # Fix src paths
            src = img.get('src')
            if src and isinstance(src, str) and '/../' in src:
                # Resolve "posts/slug/../images/..." to "images/..."
                # Assuming the structure is always relative to blog/
                parts = src.split('/../')
                if len(parts) > 1:
                    new_src = parts[-1]
                    img['src'] = new_src

        # 5. Remove inline styles from other elements (p, div, iframe)
        for tag in soup.find_all(['p', 'div', 'iframe']):
            if tag.has_attr('style'):
                del tag['style']

        # 6. Fix Headings (Ensure no H1, promote H3/H4 if they are top level)
        # This is tricky. Let's just ensure no H1.
        for h1 in soup.find_all('h1'):
            h1.name = 'h2'
            
        # If the first heading is H3 or H4, promote all headings?
        # Let's just ensure the first heading is H2.
        headings = soup.find_all(re.compile('^h[1-6]$'))
        if headings:
            first_heading = headings[0]
            if first_heading.name != 'h2':
                # Calculate offset
                current_level = int(first_heading.name[1])
                offset = current_level - 2
                if offset > 0:
                    for h in headings:
                        level = int(h.name[1])
                        new_level = max(2, level - offset)
                        h.name = f'h{new_level}'

        # Update content
        # prettify() adds extra whitespace which might be annoying, but str(soup) is safer
        # However, str(soup) might be minified.
        # Let's use decode() which is standard.
        post['content'] = soup.decode(formatter="html")

    # Save back
    with open(json_path, 'w') as f:
        json.dump(posts, f, indent=2)
    
    print("Done.")

if __name__ == "__main__":
    standardize_posts()
