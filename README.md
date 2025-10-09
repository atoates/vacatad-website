# Vacatad.com - Static Website

A modern, responsive static website built with HTML5, CSS3, and vanilla JavaScript.

## 🚀 Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern CSS**: Uses Flexbox, CSS Grid, and CSS custom properties
- **Smooth Animations**: CSS animations and JavaScript-powered scroll effects
- **Mobile-First**: Optimized for mobile devices with a hamburger menu
- **SEO Optimized**: Semantic HTML, meta tags, and structured data
- **Performance**: Optimized images, efficient CSS, and minimal JavaScript
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader friendly

## 📁 Project Structure

```
vacatad.com/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   └── script.js           # JavaScript functionality
├── assets/
│   ├── images/             # Website images
│   ├── fonts/              # Custom fonts
│   └── icons/              # SVG icons
└── README.md               # This file
```

## 🛠️ Setup & Development

### Quick Start

1. **Clone or download** this repository
2. **Open** `index.html` in your web browser
3. **Start editing** the files to customize your website

### Local Development Server

For the best development experience, serve the files through a local web server:

#### Using Python (recommended):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Using Node.js:
```bash
# Install a simple server globally
npm install -g http-server

# Run the server
http-server
```

#### Using VS Code:
Install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

Then open your browser to `http://localhost:8000` (or the port shown in your terminal).

## 🎨 Customization

### Colors
The website uses a consistent color scheme defined in CSS custom properties. To change colors, edit the `:root` variables in `css/styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #2c3e50;
    --bg-color: #ffffff;
}
```

### Content
- **Text Content**: Edit the HTML in `index.html`
- **Styling**: Modify `css/styles.css`
- **Functionality**: Update `js/script.js`
- **Images**: Add your images to `assets/images/` and update the HTML references

### Sections
The website includes these main sections:
- **Header/Navigation**: Fixed navigation bar
- **Hero**: Main banner with call-to-action
- **About**: Information about your company/service
- **Services**: Features or services offered
- **Contact**: Contact form and information
- **Footer**: Additional links and information

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE11+ (with minor limitations)

## ⚡ Performance Tips

1. **Optimize Images**: Compress images and use appropriate formats (WebP when possible)
2. **Minify CSS/JS**: Use build tools to minify your code for production
3. **Enable Gzip**: Configure your server to enable Gzip compression
4. **Use CDN**: Consider using a CDN for faster global delivery

## 🚀 Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select your branch (usually `main`)
4. Your site will be available at `https://yourusername.github.io/repository-name`

### Netlify
1. Connect your repository to Netlify
2. Deploy automatically on every push
3. Get a custom domain if needed

### Traditional Web Hosting
1. Upload all files to your web server
2. Ensure your hosting supports static files
3. Point your domain to the hosting location

## 📞 Support

If you need help with customization or have questions:

1. Check the code comments for guidance
2. Review the CSS and JavaScript for examples
3. Search for tutorials on HTML, CSS, and JavaScript basics

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔄 Updates

To keep your website up to date:
1. Regularly update content in `index.html`
2. Add new images to the `assets/images/` folder
3. Customize styles in `css/styles.css`
4. Test on different devices and browsers

---

**Made with ❤️ for modern web development**

For more advanced features, consider learning about:
- CSS preprocessors (Sass/SCSS)
- JavaScript frameworks (React, Vue, etc.)
- Build tools (Webpack, Vite, etc.)
- Static site generators (11ty, Hugo, etc.)