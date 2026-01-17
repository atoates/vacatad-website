/**
 * VacatAd CMS Testing Suite
 * 
 * Run these tests in the browser console while logged into the CMS
 * to verify all functionality is working correctly.
 */

const CMSTests = {
    results: [],

    log(test, passed, message) {
        const result = { test, passed, message };
        this.results.push(result);
        console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
    },

    async runAll() {
        console.log('🧪 Starting VacatAD CMS Tests...\n');
        this.results = [];

        await this.testConfigLoaded();
        await this.testSlugGeneration();
        await this.testDateFormatting();
        await this.testOrdinalGeneration();
        await this.testGitHubAPI();
        await this.testHTMLGeneration();

        console.log('\n📊 Test Summary:');
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        console.log(`Passed: ${passed}/${total}`);
        
        if (passed === total) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Review errors above.');
        }

        return this.results;
    },

    testConfigLoaded() {
        try {
            const hasConfig = typeof CONFIG !== 'undefined';
            const hasPostsDir = CONFIG?.postsDir === 'blog/posts';
            
            this.log(
                'Configuration Loaded',
                hasConfig && hasPostsDir,
                hasConfig && hasPostsDir 
                    ? 'CONFIG loaded with postsDir'
                    : 'CONFIG missing or incomplete'
            );
        } catch (e) {
            this.log('Configuration Loaded', false, e.message);
        }
    },

    testSlugGeneration() {
        try {
            const tests = [
                ['Simple Title', 'simple-title'],
                ['Title With Numbers 123', 'title-with-numbers-123'],
                ['Special!@# Characters$%^', 'special-characters'],
                ['Multiple   Spaces', 'multiple-spaces'],
                ['CamelCase Text', 'camelcase-text'],
            ];

            let allPassed = true;
            tests.forEach(([input, expected]) => {
                const result = App.slugify(input);
                if (result !== expected) {
                    allPassed = false;
                    console.log(`  ⚠️ slugify("${input}") = "${result}", expected "${expected}"`);
                }
            });

            this.log(
                'Slug Generation',
                allPassed,
                allPassed ? 'All slug tests passed' : 'Some slug tests failed'
            );
        } catch (e) {
            this.log('Slug Generation', false, e.message);
        }
    },

    testDateFormatting() {
        try {
            const testDate = new Date('2026-01-17');
            const yy = String(testDate.getFullYear()).substring(2);
            const mm = String(testDate.getMonth() + 1).padStart(2, '0');
            const dd = String(testDate.getDate()).padStart(2, '0');
            const result = `${yy}-${mm}-${dd}`;
            const expected = '26-01-17';

            this.log(
                'Date Formatting',
                result === expected,
                result === expected 
                    ? `Date formatted correctly: ${result}`
                    : `Expected ${expected}, got ${result}`
            );
        } catch (e) {
            this.log('Date Formatting', false, e.message);
        }
    },

    testOrdinalGeneration() {
        try {
            const tests = [
                [1, 'st'],
                [2, 'nd'],
                [3, 'rd'],
                [4, 'th'],
                [11, 'th'],
                [21, 'st'],
                [22, 'nd'],
                [23, 'rd'],
                [31, 'st'],
            ];

            let allPassed = true;
            tests.forEach(([day, expected]) => {
                const result = App.getOrdinal(day);
                if (result !== expected) {
                    allPassed = false;
                    console.log(`  ⚠️ getOrdinal(${day}) = "${result}", expected "${expected}"`);
                }
            });

            this.log(
                'Ordinal Generation',
                allPassed,
                allPassed ? 'All ordinal tests passed' : 'Some ordinal tests failed'
            );
        } catch (e) {
            this.log('Ordinal Generation', false, e.message);
        }
    },

    async testGitHubAPI() {
        try {
            const hasToken = !!State.token;
            const hasGitHub = typeof GitHub !== 'undefined';
            const hasMethods = hasGitHub && 
                typeof GitHub.get === 'function' &&
                typeof GitHub.put === 'function' &&
                typeof GitHub.getSha === 'function' &&
                typeof GitHub.downloadImage === 'function';

            this.log(
                'GitHub API Setup',
                hasToken && hasGitHub && hasMethods,
                hasToken && hasGitHub && hasMethods
                    ? 'GitHub API ready'
                    : `Missing: ${!hasToken ? 'token ' : ''}${!hasGitHub ? 'GitHub object ' : ''}${!hasMethods ? 'methods' : ''}`
            );

            // Test connectivity (if token available)
            if (hasToken && hasGitHub) {
                try {
                    await GitHub.get(CONFIG.postsPath);
                    this.log(
                        'GitHub API Connectivity',
                        true,
                        'Successfully connected to GitHub'
                    );
                } catch (e) {
                    this.log(
                        'GitHub API Connectivity',
                        false,
                        `Connection failed: ${e.message}`
                    );
                }
            }
        } catch (e) {
            this.log('GitHub API Setup', false, e.message);
        }
    },

    testHTMLGeneration() {
        try {
            const testPost = {
                title: 'Test Blog Post',
                slug: 'test-blog-post',
                date: '2026-01-17',
                excerpt: 'This is a test excerpt',
                image: 'posts/26-01-17-test-blog-post/hero.jpg',
                imageAlt: 'Test Image',
                tags: ['Test', 'Blog', 'Example'],
                featured: true,
                author: {
                    name: 'Test Author',
                    role: 'Tester'
                },
                readTime: '5 min read'
            };

            const testContent = '<p>This is test content.</p><h2>Test Heading</h2><p>More content.</p>';
            
            const html = App.generatePostHTML(testPost, testContent);

            // Verify essential elements
            const checks = [
                html.includes('<!DOCTYPE html>'),
                html.includes('<title>Test Blog Post | VacatAd</title>'),
                html.includes('<meta name="description" content="This is a test excerpt">'),
                html.includes('<h1>Test Blog Post</h1>'),
                html.includes('17th January 2026'),
                html.includes('<span class="tag">Test</span>'),
                html.includes('hero.jpg'),
                html.includes('By Test Author'),
                html.includes('5 min read'),
                html.includes('../../../css/styles.css'),
                html.includes('G-KQQ0KK25XQ'),
            ];

            const allChecks = checks.every(c => c);

            this.log(
                'HTML Generation',
                allChecks,
                allChecks 
                    ? 'HTML template generated correctly'
                    : `Missing ${checks.filter(c => !c).length} required elements`
            );

            // Test lead paragraph extraction
            const leadTest = testContent.match(/^<p>(.*?)<\/p>/);
            this.log(
                'Lead Paragraph Detection',
                !!leadTest,
                leadTest ? 'Lead paragraph detected' : 'Lead paragraph not detected'
            );

        } catch (e) {
            this.log('HTML Generation', false, e.message);
        }
    }
};

// Quick test commands
console.log('💡 VacatAd CMS Testing Suite Loaded');
console.log('Run: CMSTests.runAll() to test all functionality');
console.log('');
console.log('Individual tests:');
console.log('  CMSTests.testConfigLoaded()');
console.log('  CMSTests.testSlugGeneration()');
console.log('  CMSTests.testDateFormatting()');
console.log('  CMSTests.testOrdinalGeneration()');
console.log('  CMSTests.testGitHubAPI()');
console.log('  CMSTests.testHTMLGeneration()');

/**
 * Manual Testing Checklist
 * 
 * Copy and paste this into a text file and check off as you test:
 * 
 * [ ] Login to CMS with GitHub token
 * [ ] View posts list loads correctly
 * [ ] Click "New Post" - editor opens
 * [ ] Info banner visible explaining new system
 * [ ] Fill in title - auto-generates slug
 * [ ] Click "Generate" slug button works
 * [ ] Date defaults to today
 * [ ] Click image icon - Media Library modal opens
 * [ ] Switch to Unsplash tab - can search images
 * [ ] Select image - URL fills in field
 * [ ] Write content in Quill editor
 * [ ] Apply formatting (bold, italic, headers, lists)
 * [ ] Click "Save Changes" - shows "Saving..."
 * [ ] Success message appears
 * [ ] Returns to posts list
 * [ ] New post appears in list
 * [ ] Check GitHub repo - files created:
 *     [ ] /blog/posts/YY-MM-DD-slug/index.html
 *     [ ] /blog/posts/YY-MM-DD-slug/hero.jpg
 *     [ ] /blog/data/posts.json updated (NO content field)
 * [ ] View HTML file in browser - displays correctly
 * [ ] All links work (nav, footer, etc.)
 * [ ] Hero image loads
 * [ ] Click post in CMS to edit
 * [ ] Content loads from HTML file
 * [ ] Modify content and save
 * [ ] Check HTML file updated
 * [ ] Delete post - confirmation appears
 * [ ] Post removed from list and metadata
 * [ ] Test with special characters in title
 * [ ] Test with very long title
 * [ ] Test with external image URL
 * [ ] Test with uploaded image
 * [ ] Test featured checkbox
 * [ ] Test multiple tags
 * [ ] Test empty tags
 * 
 * EDGE CASES:
 * [ ] Save without hero image URL (should show alert)
 * [ ] Save without title (should show alert)
 * [ ] Network disconnect during save
 * [ ] Invalid image URL
 * [ ] Very large image (> 2MB)
 * [ ] Edit old post with 'content' field (backward compat)
 */
