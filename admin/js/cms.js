// Configuration
const CONFIG = {
    owner: 'atoates',
    repo: 'vacatad-website',
    branch: 'main',
    postsPath: 'blog/data/posts.json',
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

    decodeContent(content) {
        return new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
    },

    encodeContent(content) {
        return btoa(unescape(encodeURIComponent(content)));
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
        this.quill.root.innerHTML = post.content || '';
    },

    async savePost() {
        const title = document.getElementById('post-title').value;
        if (!title) return alert('Title is required');

        const postData = {
            id: State.currentPostId || Date.now(),
            title,
            slug: document.getElementById('post-slug').value || this.slugify(title),
            date: document.getElementById('post-date').value,
            excerpt: document.getElementById('post-excerpt').value,
            image: document.getElementById('post-image').value,
            imageAlt: title,
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
            featured: document.getElementById('post-featured').checked,
            author: {
                name: document.getElementById('post-author-name').value,
                role: document.getElementById('post-author-role').value
            },
            readTime: document.getElementById('post-readtime').value,
            content: this.quill.root.innerHTML
        };

        // Update local state
        if (State.currentPostId) {
            const idx = State.posts.findIndex(p => p.id === State.currentPostId);
            if (idx !== -1) State.posts[idx] = { ...State.posts[idx], ...postData };
        } else {
            State.posts.unshift(postData);
        }

        // Push to GitHub
        try {
            const content = GitHub.encodeContent(JSON.stringify(State.posts, null, 2));
            const res = await GitHub.put(CONFIG.postsPath, content, `Update post: ${title}`, State.postsSha);
            State.postsSha = res.content.sha;
            alert('Saved successfully!');
            this.showView('list');
            this.renderList();
        } catch (e) {
            alert('Error saving: ' + e.message);
        }
    },

    async deletePost() {
        if (!confirm('Are you sure?')) return;
        
        State.posts = State.posts.filter(p => p.id !== State.currentPostId);
        
        try {
            const content = GitHub.encodeContent(JSON.stringify(State.posts, null, 2));
            const res = await GitHub.put(CONFIG.postsPath, content, `Delete post ${State.currentPostId}`, State.postsSha);
            State.postsSha = res.content.sha;
            alert('Deleted successfully!');
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
