#!/usr/bin/env python3
"""
Update Google Analytics Measurement ID across all HTML files
"""

import os
import glob

# Your actual measurement ID
MEASUREMENT_ID = "G-DEZQKBTTFH"
OLD_PLACEHOLDER = "G-XXXXXXXXXX"

def update_file(filepath):
    """Update a single file with the new measurement ID"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file contains the placeholder
        if OLD_PLACEHOLDER in content:
            # Replace the placeholder with actual ID
            updated_content = content.replace(OLD_PLACEHOLDER, MEASUREMENT_ID)
            
            # Write back to file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"✅ Updated: {filepath}")
            return True
        else:
            print(f"⏭️  Skipped (no placeholder): {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    """Main function to update all HTML files"""
    
    # Get all HTML files in root directory
    root_html_files = [
        'contact.html',
        'privacy.html',
        'terms.html',
        'faqs.html',
        'affiliate-program.html',
        'local.html'
    ]
    
    # Get all blog HTML files
    blog_html_files = glob.glob('blog/**/*.html', recursive=True)
    
    # Combine all files
    all_files = root_html_files + blog_html_files
    
    print(f"🔍 Found {len(all_files)} HTML files to check\n")
    
    updated_count = 0
    
    for filepath in all_files:
        if os.path.exists(filepath):
            if update_file(filepath):
                updated_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
    
    print(f"\n✅ Updated {updated_count} files with measurement ID: {MEASUREMENT_ID}")

if __name__ == "__main__":
    main()
