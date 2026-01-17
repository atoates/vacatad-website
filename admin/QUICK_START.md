# Quick Start Guide - Updated VacatAd CMS

## What Changed?

**OLD SYSTEM:**
- Blog content stored in `/blog/data/posts.json`
- Posts displayed via `/blog/article.html?slug=xxx`

**NEW SYSTEM:**
- Blog content in standalone HTML files at `/blog/posts/YY-MM-DD-slug/index.html`
- Hero images downloaded and saved as `hero.jpg` in post directory
- Only metadata stored in `posts.json`

## How to Create a New Blog Post

### Step 1: Access the CMS
1. Go to `https://vacatad.com/admin/`
2. Log in with your GitHub token

### Step 2: Create New Post
1. Click **"New Post"** in the sidebar
2. You'll see a blue info banner explaining the new system

### Step 3: Fill in Post Details

**Required Fields:**
- **Title:** Your blog post title
- **Hero Image URL:** Image URL (from Unsplash or Media Library)

**Optional Fields:**
- **Slug:** Auto-generated from title, or customize
- **Date:** Defaults to today
- **Excerpt:** Brief summary for SEO and post previews
- **Tags:** Comma-separated (e.g., "Business Rates, Tax Planning, Relief")
- **Featured:** Check to feature on homepage

**Hidden Fields (Auto-filled):**
- Author Name: "VacatAd Team"
- Author Role: "Property Solutions Experts"
- Read Time: "5 min read"

### Step 4: Select Hero Image

**Option A: Use Unsplash**
1. Click the image icon 📷 next to "Cover Image URL"
2. Click "Unsplash" tab
3. Search for relevant image
4. Click image to select
5. URL auto-fills

**Option B: Use Media Library**
1. Click the image icon 📷
2. Click "Media Library" tab
3. Upload new image OR select existing
4. Click image to select

**Option C: Paste URL**
- Paste any image URL directly (must be publicly accessible)

### Step 5: Write Content

1. Use the rich-text editor (Quill)
2. First paragraph will automatically become the "lead" paragraph (larger text)
3. Use formatting tools:
   - Headers (H2, H3, H4)
   - Bold, italic, underline
   - Lists (ordered/unordered)
   - Links
   - Images (click image icon in editor)
   - Blockquotes

### Step 6: Save

1. Click **"Save Changes"**
2. Wait for progress (shows "Saving...")
3. Process takes 2-4 seconds:
   - Downloads hero image
   - Creates post directory
   - Generates HTML file
   - Updates metadata
4. Success message appears
5. Returns to posts list

### What Gets Created?

```
blog/posts/26-01-17-your-post-slug/
├── index.html  ← Full standalone blog post
└── hero.jpg    ← Downloaded hero image
```

Plus metadata entry in `/blog/data/posts.json` (without content)

## How to Edit an Existing Post

1. Go to CMS dashboard
2. Click on post from the list
3. Content loads from standalone HTML file
4. Edit as needed
5. Click "Save Changes"
6. Both HTML file and metadata update

## How to Delete a Post

1. Open post in editor
2. Click **"Delete Post"** (red button)
3. Confirm deletion
4. Post removed from metadata
5. Files deleted from GitHub
6. ⚠️ Directory may need manual cleanup via git

## Tips & Best Practices

### Image Selection
- ✅ Use landscape images (16:9 ratio ideal)
- ✅ High resolution (1200px+ width)
- ✅ Relevant to content
- ✅ Optimize before upload (< 500KB)

### Content Writing
- ✅ Start with engaging first paragraph (becomes lead)
- ✅ Use H2 for main sections
- ✅ Use H3 for subsections
- ✅ Keep paragraphs concise
- ✅ Use lists for clarity
- ✅ Add images throughout (not just hero)

### SEO Optimization
- ✅ Write compelling title (50-60 chars)
- ✅ Create descriptive excerpt (150-160 chars)
- ✅ Use relevant tags (3-5 recommended)
- ✅ Include keywords naturally
- ✅ Use descriptive headings

### Slugs
- ✅ Auto-generated from title (recommended)
- ✅ Lowercase, hyphenated
- ✅ No special characters
- ✅ Keep under 50 characters

## Troubleshooting

### "Hero image URL is required"
**Solution:** You must provide an image URL. Use Unsplash or Media Library.

### "Failed to download image"
**Possible causes:**
- Image URL is invalid
- CORS restrictions on image
- Network timeout

**Solutions:**
- Try different image source
- Use Unsplash (CORS-friendly)
- Upload to Media Library first

### "Saving..." hangs
**Solution:** 
- Check browser console for errors
- Check network connection
- Refresh page and try again
- Verify GitHub token is valid

### Content not loading when editing
**Solution:**
- Check browser console
- Verify HTML file exists in repo
- Try creating new post instead

### Related Articles section is empty
**Expected:** This is normal - manual feature for future enhancement

## Viewing Your Published Post

### Direct Access
`https://vacatad.com/blog/posts/YY-MM-DD-your-slug/index.html`

### Via Blog Index
Posts appear on `/blog/index.html` (if blog index is updated to read from posts.json)

## Need Help?

- Check browser console (F12) for error messages
- Verify GitHub token has write permissions
- Check network tab for failed requests
- Review `CMS_UPDATE_SUMMARY.md` for detailed documentation

---

**Quick Reference Card**

```
NEW POST WORKFLOW
├── 1. Click "New Post"
├── 2. Enter Title ✓
├── 3. Select Hero Image ✓
├── 4. Write Content
├── 5. Add Tags
├── 6. Set Featured (optional)
└── 7. Save → Done!

CREATES:
• /blog/posts/YY-MM-DD-slug/index.html
• /blog/posts/YY-MM-DD-slug/hero.jpg
• Entry in /blog/data/posts.json
```
