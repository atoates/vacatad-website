// Configuration
const CONFIG = {
    owner: 'atoates',
    repo: 'vacatad-website',
    branch: 'main',
    postsPath: 'blog/data/posts.json',
    postsDir: 'blog/posts',
    imagesPath: 'blog/images',
    unsplashKey: 'fdDbx-PtU0_yUG7tesTCiAP_Z8nyabBJnQc5zVgilHg'
};

// State
const State = {
    token: localStorage.getItem('githubToken'),
    user: localStorage.getItem('githubUser'),
    posts: [],
    postsSha: null,
    currentPostId: null,
    media: []
};

// GitHub API Wrapper
const GitHub = {
    baseUrl: `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}`,

    headers() {
        return {
            'Authorization': `Bearer ${State.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        };
    },

    async get(path) {
        const res = await fetch(`${this.baseUrl}/contents/${path}?ref=${CONFIG.branch}`, { headers: this.headers() });
        if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
        return await res.json();
    },

    async put(path, content, message, sha = null) {
        const body = {
            message,
            content, // Base64 encoded
            branch: CONFIG.branch
        };
        if (sha) body.sha = sha;

        const res = await fetch(`${this.baseUrl}/contents/${path}`, {
            method: 'PUT',
            headers: this.headers(),
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
        return await res.json();
    },

    async getSha(path) {
        try {
            const data = await this.get(path);
            return data.sha;
        } catch (e) {
            return null; // File doesn't exist
        }
    },

    decodeContent(content) {
        return new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
    },

    encodeContent(content) {
        return btoa(unescape(encodeURIComponent(content)));
    },

    async downloadImage(url) {
        // Download image and return base64 encoded content
        // Use a CORS proxy if needed for external images
        try {
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Image download error:', error);
            throw new Error('Failed to download image. Please check the URL and CORS settings.');
        }
    }
};

// Media Library
const MediaLibrary = {
    isOpen: false,
    onSelect: null, // Callback when image is selected

    init() {
        const modal = document.getElementById('media-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        closeBtn.onclick = () => this.close();
        
        // Upload Handlers
        uploadZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => this.handleUpload(e.target.files[0]);
        
        uploadZone.ondragover = (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        };
        uploadZone.ondragleave = () => uploadZone.classList.remove('dragover');
        uploadZone.ondrop = (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleUpload(e.dataTransfer.files[0]);
        };

        // Tab switching
        document.getElementById('tab-repo').onclick = () => this.switchTab('repo');
        document.getElementById('tab-unsplash').onclick = () => this.switchTab('unsplash');
    },

    open(callback) {
        this.onSelect = callback;
        document.getElementById('media-modal').style.display = 'flex';
        this.loadRepoImages();
    },

    close() {
        document.getElementById('media-modal').style.display = 'none';
        this.onSelect = null;
    },

    switchTab(tab) {
        document.querySelectorAll('.media-tab').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        document.getElementById('view-repo').style.display = tab === 'repo' ? 'block' : 'none';
        document.getElementById('view-unsplash').style.display = tab === 'unsplash' ? 'block' : 'none';
    },

    async loadRepoImages() {
        const grid = document.getElementById('repo-grid');
        grid.innerHTML = '<p>Loading images...</p>';
        
        try {
            const data = await GitHub.get(CONFIG.imagesPath);
            grid.innerHTML = '';
            
            // Filter for images
            const images = data.filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
            
            images.forEach(img => {
                const div = document.createElement('div');
                div.className = 'media-item';
                // Use download_url for direct access, or construct relative path
                // For the blog, we want relative paths usually: "posts/slug/image.jpg" or "../images/file.jpg"
                // But since we are in admin/index.html, we need to be careful.
                // Let's store the absolute path for now, or relative to root.
                // Actually, for the blog post content, we usually want `../blog/images/filename` if the post is in `blog/article.html`?
                // Wait, the blog structure is `blog/article.html?slug=...`.
                // So images should be referenced as `images/filename` if they are in `blog/images`.
                // Let's check `blog/article.html` again. It loads `data/posts.json`.
                // The images in `posts.json` are like `posts/slug/image.webp` or `https://...`.
                // If we upload to `blog/images/`, the path should be `images/filename.webp` relative to `blog/index.html`.
                // But `blog/article.html` is in `blog/`. So `images/filename.webp` works.
                
                // However, the existing posts use `posts/slug/image.webp`.
                // We are simplifying to a central `blog/images` folder.
                
                const publicUrl = `../blog/images/${img.name}`; // Relative to admin/index.html for preview?
                // No, for the CMS preview we need the raw GitHub URL or the relative path if served locally.
                // Since this is a static site, `../blog/images/` works if we are at `vacatad.com/admin/`.
                
                div.innerHTML = `<img src="${img.download_url}" loading="lazy">`;
                div.onclick = () => {
                    if (this.onSelect) {
                        // Return the path that should be saved in the JSON
                        // If the HTML file is in `blog/`, then `images/filename` is correct.
                        this.onSelect(`images/${img.name}`); 
                        this.close();
                    }
                };
                grid.appendChild(div);
            });
        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p>Error loading images.</p>';
        }
    },

    async handleUpload(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1]; // Remove data:image/...;base64,
            const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            
            try {
                document.getElementById('upload-status').textContent = 'Uploading...';
                await GitHub.put(`${CONFIG.imagesPath}/${filename}`, content, `Upload ${filename}`);
                document.getElementById('upload-status').textContent = 'Upload complete!';
                this.loadRepoImages(); // Refresh
            } catch (err) {
                alert('Upload failed: ' + err.message);
                document.getElementById('upload-status').textContent = '';
            }
        };
        reader.readAsDataURL(file);
    },
    
    async searchUnsplash() {
        const query = document.getElementById('unsplash-query').value;
        if (!query) return;
        
        const grid = document.getElementById('unsplash-grid');
        grid.innerHTML = 'Searching...';
        
        try {
            const res = await fetch(`https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&per_page=12&client_id=${CONFIG.unsplashKey}`);
            const data = await res.json();
            
            grid.innerHTML = '';
            data.results.forEach(photo => {
                const div = document.createElement('div');
                div.className = 'media-item';
                div.innerHTML = `<img src="${photo.urls.small}" loading="lazy">`;
                div.onclick = () => {
                    if (this.onSelect) {
                        this.onSelect(photo.urls.regular);
                        this.close();
                    }
                };
                grid.appendChild(div);
            });
        } catch (e) {
            grid.innerHTML = 'Error searching Unsplash.';
        }
    }
};

// App Logic
const App = {
    quill: null,

    init() {
        if (!State.token) window.location.href = 'login.html';
        document.getElementById('user-name').textContent = State.user;

        this.initQuill();
        this.loadPosts();
        MediaLibrary.init();

        // Event Listeners
        document.getElementById('nav-posts').onclick = () => this.showView('list');
        document.getElementById('nav-new').onclick = () => this.createNew();
        document.getElementById('btn-save').onclick = () => this.savePost();
        document.getElementById('btn-delete').onclick = () => this.deletePost();
        document.getElementById('btn-select-cover').onclick = () => {
            MediaLibrary.open((url) => {
                document.getElementById('post-image').value = url;
                // Optional: Show preview
            });
        };
        document.getElementById('btn-generate-slug').onclick = () => {
            const title = document.getElementById('post-title').value;
            document.getElementById('post-slug').value = this.slugify(title);
        };
    },

    initQuill() {
        this.quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ 'header': [2, 3, 4, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ],
                    handlers: {
                        image: () => {
                            MediaLibrary.open((url) => {
                                const range = this.quill.getSelection(true);
                                this.quill.insertEmbed(range.index, 'image', url);
                            });
                        }
                    }
                }
            }
        });
    },

    async loadPosts() {
        const container = document.getElementById('view-list');
        container.innerHTML = '<p>Loading posts...</p>';
        
        try {
            const data = await GitHub.get(CONFIG.postsPath);
            State.postsSha = data.sha;
            const json = JSON.parse(GitHub.decodeContent(data.content));
            State.posts = Array.isArray(json) ? json : (json.blog || []);
            
            this.renderList();
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p>Error loading posts. Check console for details.</p>';
        }
    },

    renderList() {
        const container = document.getElementById('view-list');
        container.innerHTML = '';
        
        if (!State.posts || State.posts.length === 0) {
            container.innerHTML = '<p>No posts found.</p>';
            return;
        }

        const sorted = [...State.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sorted.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card';
            div.innerHTML = `
                <div>
                    <div style="font-weight:600; font-size:1.1rem;">${post.title}</div>
                    <div style="color:#666; font-size:0.9rem; margin-top:4px;">
                        ${post.date} • ${post.author?.name || 'VacatAd Team'}
                    </div>
                </div>
                <div class="post-status status-published">Published</div>
            `;
            div.onclick = () => this.editPost(post.id);
            container.appendChild(div);
        });
    },

    showView(view) {
        document.getElementById('view-list').classList.add('hidden');
        document.getElementById('view-editor').classList.add('hidden');
        
        if (view === 'list') {
            document.getElementById('view-list').classList.remove('hidden');
            document.getElementById('page-title').textContent = 'All Posts';
        } else {
            document.getElementById('view-editor').classList.remove('hidden');
        }
    },

    createNew() {
        State.currentPostId = null;
        this.clearForm();
        this.showView('editor');
        document.getElementById('page-title').textContent = 'New Post';
        document.getElementById('btn-delete').classList.add('hidden');
    },

    editPost(id) {
        const post = State.posts.find(p => p.id === id);
        if (!post) return;
        
        State.currentPostId = id;
        this.fillForm(post);
        this.showView('editor');
        document.getElementById('page-title').textContent = 'Edit Post';
        document.getElementById('btn-delete').classList.remove('hidden');
    },

    clearForm() {
        document.getElementById('post-title').value = '';
        document.getElementById('post-slug').value = '';
        document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('post-excerpt').value = '';
        document.getElementById('post-image').value = '';
        document.getElementById('post-tags').value = '';
        document.getElementById('post-featured').checked = false;
        this.quill.root.innerHTML = '';
    },

    fillForm(post) {
        document.getElementById('post-title').value = post.title || '';
        document.getElementById('post-slug').value = post.slug || '';
        
        // Date handling
        try {
            const d = new Date(post.date);
            document.getElementById('post-date').value = !isNaN(d) ? d.toISOString().split('T')[0] : post.date;
        } catch(e) {
            document.getElementById('post-date').value = post.date;
        }

        document.getElementById('post-excerpt').value = post.excerpt || '';
        document.getElementById('post-image').value = post.image || '';
        document.getElementById('post-tags').value = (post.tags || []).join(', ');
        document.getElementById('post-featured').checked = !!post.featured;
        
        // Load content from standalone HTML file if editing existing post
        if (post.slug) {
            this.loadPostContent(post);
        } else {
            this.quill.root.innerHTML = post.content || '';
        }
    },

    async loadPostContent(post) {
        try {
            // Extract date prefix from slug if available, otherwise use post date
            const date = post.date.replace(/-/g, '-').substring(2); // Convert 2025-12-05 to 25-12-05
            const postPath = `${CONFIG.postsDir}/${date}-${post.slug}/index.html`;
            
            const data = await GitHub.get(postPath);
            const html = GitHub.decodeContent(data.content);
            
            // Extract content between article-content div
            const contentMatch = html.match(/<div class="article-content">([\s\S]*?)<\/div>\s*<!-- Related Articles -->/);
            if (contentMatch && contentMatch[1]) {
                // Extract the inner content, removing the lead paragraph wrapper and other structural elements
                let content = contentMatch[1].trim();
                
                // Remove the lead paragraph wrapper to get just the HTML content
                content = content.replace(/<p class="lead">([\s\S]*?)<\/p>/, '<p>$1</p>');
                
                this.quill.root.innerHTML = content;
            } else {
                this.quill.root.innerHTML = post.content || '';
            }
        } catch (e) {
            console.error('Error loading post content:', e);
            // Fallback to content field if available
            this.quill.root.innerHTML = post.content || '';
        }
    },

    async savePost() {
        const title = document.getElementById('post-title').value;
        if (!title) return alert('Title is required');

        const slug = document.getElementById('post-slug').value || this.slugify(title);
        const date = document.getElementById('post-date').value;
        const imageUrl = document.getElementById('post-image').value;
        
        if (!imageUrl) return alert('Hero image URL is required');

        // Format date as YY-MM-DD for directory name
        const dateObj = new Date(date);
        const yy = String(dateObj.getFullYear()).substring(2);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const datePrefix = `${yy}-${mm}-${dd}`;
        
        const postDir = `${CONFIG.postsDir}/${datePrefix}-${slug}`;
        const heroImagePath = `${postDir}/hero.jpg`;
        const indexPath = `${postDir}/index.html`;

        // Prepare post metadata (no content field)
        const postData = {
            id: State.currentPostId || Date.now(),
            title,
            slug,
            date,
            excerpt: document.getElementById('post-excerpt').value,
            image: `posts/${datePrefix}-${slug}/hero.jpg`,
            imageAlt: title,
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
            featured: document.getElementById('post-featured').checked,
            author: {
                name: document.getElementById('post-author-name').value,
                role: document.getElementById('post-author-role').value
            },
            readTime: document.getElementById('post-readtime').value
        };

        try {
            // Show progress
            const saveBtn = document.getElementById('btn-save');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            // Step 1: Download and save hero image
            console.log('Downloading hero image...');
            const imageBase64 = await GitHub.downloadImage(imageUrl);
            const heroSha = await GitHub.getSha(heroImagePath);
            await GitHub.put(heroImagePath, imageBase64, `Add hero image for ${title}`, heroSha);

            // Step 2: Generate and save standalone HTML
            console.log('Generating HTML...');
            const htmlContent = this.generatePostHTML(postData, this.quill.root.innerHTML);
            const htmlBase64 = GitHub.encodeContent(htmlContent);
            const indexSha = await GitHub.getSha(indexPath);
            await GitHub.put(indexPath, htmlBase64, `Update post: ${title}`, indexSha);

            // Step 3: Update posts.json metadata
            console.log('Updating posts.json...');
            if (State.currentPostId) {
                const idx = State.posts.findIndex(p => p.id === State.currentPostId);
                if (idx !== -1) {
                    State.posts[idx] = { ...State.posts[idx], ...postData };
                }
            } else {
                State.posts.unshift(postData);
            }

            const postsContent = GitHub.encodeContent(JSON.stringify(State.posts, null, 2));
            const res = await GitHub.put(CONFIG.postsPath, postsContent, `Update metadata for: ${title}`, State.postsSha);
            State.postsSha = res.content.sha;

            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            alert('Post saved successfully!');
            this.showView('list');
            this.renderList();
        } catch (e) {
            console.error('Save error:', e);
            alert('Error saving: ' + e.message);
            document.getElementById('btn-save').textContent = 'Save Changes';
            document.getElementById('btn-save').disabled = false;
        }
    },

    generatePostHTML(post, content) {
        // Format date for display
        const dateObj = new Date(post.date);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-GB', options);
        const ordinal = this.getOrdinal(dateObj.getDate());
        const displayDate = formattedDate.replace(/\d+/, dateObj.getDate() + ordinal);

        // Generate tags HTML
        const tagsHTML = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n                        ');

        // Clean content - ensure it's properly formatted
        let cleanContent = content.trim();
        
        // Extract first paragraph as lead if it starts with <p>
        let leadParagraph = '';
        const firstPMatch = cleanContent.match(/^<p>(.*?)<\/p>/s);
        if (firstPMatch) {
            leadParagraph = `<p class="lead">${firstPMatch[1]}</p>\n\n            `;
            cleanContent = cleanContent.replace(/^<p>.*?<\/p>\s*/, '');
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | VacatAd</title>
    <meta name="description" content="${post.excerpt}">
    <link rel="stylesheet" href="../../../css/styles.css">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#232523">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="../../../assets/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="../../../assets/favicons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../../../assets/favicons/favicon-16x16.png">
    <link rel="icon" type="image/webp" sizes="32x32" href="../../../assets/favicons/favicon-32x32.webp">
    <link rel="apple-touch-icon" sizes="180x180" href="../../../assets/favicons/apple-touch-icon.png">
    <link rel="icon" href="../../../assets/favicons/favicon.ico" sizes="any">
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-KQQ0KK25XQ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-KQQ0KK25XQ');
    </script>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <a href="../../../index.html">
                        <img src="../../../assets/images/asset-8.webp" alt="VacatAd Logo" class="logo-icon" width="223" height="223" loading="lazy">
                        <span class="logo-text">VacatAd</span>
                    </a>
                </div>
                <ul class="nav-menu" id="primary-navigation">
                    <li class="nav-item"><a href="../../../index.html" class="nav-link">Home</a></li>
                    <li class="nav-item"><a href="../../../index.html#why-vacatad" class="nav-link">Why VacatAd</a></li>
                    <li class="nav-item"><a href="../../../index.html#how-we-work" class="nav-link">How We Work</a></li>
                    <li class="nav-item"><a href="../../index.html" class="nav-link active">Blog</a></li>
                    <li class="nav-item"><a href="../../../faqs.html" class="nav-link">FAQs</a></li>
                </ul>
                <div class="cta-nav">
                    <a href="../../../router-dashboard.html" class="cta-button-nav dashboard">Dashboard</a>
                    <a href="../../../contact.html" class="cta-button-nav">Get in touch</a>
                </div>
                <button class="nav-toggle" id="mobile-menu" aria-label="Toggle menu" aria-controls="primary-navigation" aria-expanded="false">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </button>
            </div>
        </nav>
    </header>

    <main>
        <article class="blog-post">
            <div class="container">
                <!-- Hero Image -->
                <div class="blog-hero">
                    <img src="hero.jpg" 
                         alt="${post.imageAlt}" 
                         class="hero-image">
                </div>

                <!-- Article Header -->
                <header class="article-header">
                    <h1>${post.title}</h1>
                    <div class="article-meta">
                        <span class="author">By ${post.author.name}</span>
                        <span class="date">${displayDate}</span>
                        <span class="read-time">${post.readTime}</span>
                    </div>
                    <div class="article-tags">
                        ${tagsHTML}
                    </div>
                </header>

                <!-- Article Content -->
                <div class="article-content">
                    ${leadParagraph}${cleanContent}
                </div>

        <!-- Related Articles -->
        <div class="related-articles">
            <h3>Related Articles</h3>
            <div class="article-grid">
                <!-- Related articles will be added here -->
            </div>
        </div>
            </div>
        </article>
    </main>

    <div id="footer-component"></div>
    <script src="../../../js/footer-component.js"></script>
    <script src="../../../js/script.js"></script>
</body>
</html>`;
    },

    getOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    },

    async deletePost() {
        if (!confirm('Are you sure? This will delete the post directory and all its contents.')) return;
        
        const post = State.posts.find(p => p.id === State.currentPostId);
        if (!post) return alert('Post not found');

        try {
            // Extract date prefix from the image path or reconstruct from date
            const dateObj = new Date(post.date);
            const yy = String(dateObj.getFullYear()).substring(2);
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const datePrefix = `${yy}-${mm}-${dd}`;
            
            const postDir = `${CONFIG.postsDir}/${datePrefix}-${post.slug}`;
            
            // Note: GitHub API doesn't support directory deletion directly
            // We need to delete files individually or use a git tree operation
            // For simplicity, we'll just update posts.json and note that manual cleanup may be needed
            console.warn(`Note: Post directory ${postDir} should be manually deleted or cleaned up via git`);
            
            // Delete individual files
            try {
                const indexSha = await GitHub.getSha(`${postDir}/index.html`);
                if (indexSha) {
                    await GitHub.put(`${postDir}/index.html`, '', `Delete post HTML: ${post.title}`, indexSha);
                }
            } catch (e) {
                console.warn('Could not delete index.html:', e);
            }

            try {
                const heroSha = await GitHub.getSha(`${postDir}/hero.jpg`);
                if (heroSha) {
                    await GitHub.put(`${postDir}/hero.jpg`, '', `Delete hero image: ${post.title}`, heroSha);
                }
            } catch (e) {
                console.warn('Could not delete hero.jpg:', e);
            }

            // Remove from posts.json
            State.posts = State.posts.filter(p => p.id !== State.currentPostId);
            
            const content = GitHub.encodeContent(JSON.stringify(State.posts, null, 2));
            const res = await GitHub.put(CONFIG.postsPath, content, `Delete post: ${post.title}`, State.postsSha);
            State.postsSha = res.content.sha;
            
            alert('Post deleted from metadata. Note: Post directory may need manual cleanup.');
            this.showView('list');
            this.renderList();
        } catch (e) {
            alert('Error deleting: ' + e.message);
        }
    },

    slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
