import json
import re
from bs4 import BeautifulSoup

def analyze_posts():
    with open('blog/data/posts.json', 'r') as f:
        posts = json.load(f)

    print(f"Found {len(posts)} posts.")
    
    for post in posts:
        print(f"\n--- Post: {post['title']} (ID: {post['id']}) ---")
        soup = BeautifulSoup(post['content'], 'html.parser')
        
        # Check headings
        headings = [h.name for h in soup.find_all(re.compile('^h[1-6]$'))]
        print(f"Headings structure: {headings}")
        
        # Check for inline styles
        elements_with_style = soup.find_all(attrs={"style": True})
        if elements_with_style:
            print(f"Found {len(elements_with_style)} elements with inline styles.")
            for el in elements_with_style[:3]: # Show first 3
                print(f"  - <{el.name} style='{el['style']}'>")

        # Check for empty paragraphs
        empty_ps = [p for p in soup.find_all('p') if not p.get_text(strip=True) and not p.find('img')]
        if empty_ps:
            print(f"Found {len(empty_ps)} empty paragraphs.")

        # Check images
        images = soup.find_all('img')
        if images:
            print(f"Found {len(images)} images.")
            for img in images:
                print(f"  - Src: {img.get('src')}")

        # Check for weird classes
        elements_with_class = soup.find_all(attrs={"class": True})
        classes = set()
        for el in elements_with_class:
            classes.update(el['class'])
        if classes:
            print(f"Classes used: {classes}")

if __name__ == "__main__":
    analyze_posts()
