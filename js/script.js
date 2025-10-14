// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initSmoothScrolling();
    // initContactForm(); // Disabled - using Jotform embed instead
    initScrollEffects();
    initMobileMenu();
    initPhoneTracking();
    initCTATracking();
    initFAQs();
    initScrollProgress();
    initParallaxEffects();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.header');
    let lastScrollTop = 0;

    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove scrolled class for navbar styling
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });

    // Highlight active navigation link
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                const navToggle = document.querySelector('.nav-toggle');
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        // Ensure aria-expanded reflects state
        const syncAria = () => {
            const isOpen = navMenu.classList.contains('active');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            syncAria();
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                syncAria();
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
            
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                syncAria();
            }
        });
        // Initialize aria-expanded
        syncAria();
    }
}

// Contact form functionality - DEPRECATED
// The homepage now uses Jotform embed instead of the custom form
// Keeping this commented out for reference if needed in future
/*
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const name = formData.get('name')?.trim();
        const email = formData.get('email')?.trim();
        const propertyAddress = formData.get('property-address')?.trim();
        const postcode = formData.get('postcode')?.trim().toUpperCase();
        const consent = formData.get('consent');

        if (!name || !email || !propertyAddress || !postcode) {
            showNotification('Please complete all required fields.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        const postcodePattern = /^[A-Za-z0-9 ]{3,10}$/;
        if (!postcodePattern.test(postcode)) {
            showNotification('Please enter a valid postcode.', 'error');
            return;
        }

        if (!consent) {
            showNotification('Please consent to be contacted about business rates relief.', 'error');
            return;
        }

        const submitButton = this.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        setTimeout(() => {
            showNotification('Thank you! Assessment request received — we\'ll reply within 1 business day.', 'success');
            contactForm.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            trackConversion('assessment_request');
        }, 1600);
    });
}
*/

// Phone number click tracking
function initPhoneTracking() {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    
    phoneLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            trackPhoneClick(phoneNumber);
        });
    });
}

// CTA button tracking
function initCTATracking() {
    const ctaButtons = document.querySelectorAll('.cta-button, .cta-button-nav, .footer-cta');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            const section = this.closest('section')?.className || 'navigation';
            trackCTAClick(buttonText, section);
        });
    });
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Conversion tracking
function trackConversion(eventType, eventData = {}) {
    // Only log in development environment
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5500') {
        console.log(`[DEV] Conversion tracked: ${eventType}`, eventData);
        return;
    }
    
    // Production analytics - Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventType, {
            event_category: eventData.category || 'engagement',
            event_label: eventData.label || 'vacatad_website',
            value: eventData.value || undefined,
            ...eventData
        });
    }
    
    // Add other analytics here (Facebook Pixel, LinkedIn, etc.)
}

// Enhanced tracking for specific actions
function trackPhoneClick(phoneNumber) {
    trackConversion('phone_call', {
        category: 'leads',
        label: 'phone_click',
        phone_number: phoneNumber
    });
}

function trackFormSubmit(formType) {
    trackConversion('form_submit', {
        category: 'leads',
        label: formType,
        form_type: formType
    });
}

function trackCTAClick(ctaText, ctaLocation) {
    trackConversion('cta_click', {
        category: 'engagement',
        label: ctaText,
        location: ctaLocation
    });
}

function trackBlogRead(articleTitle, readTime) {
    trackConversion('blog_read', {
        category: 'content',
        label: articleTitle,
        read_time: readTime
    });
}

function trackCalculatorUse() {
    trackConversion('calculator_use', {
        category: 'leads',
        label: 'rates_calculator'
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 0.9rem;
        line-height: 1.4;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#6DCED1',
        warning: '#ffc107'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 6000);
}

// Scroll effects and animations
function initScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Enhanced animation types - different effects for different elements
    const fadeUpElements = document.querySelectorAll('.feature-card, .process-step, .result-item, .tech-item, .contact-info, .contact-form, .blog-card, .faq-item, .client-logo, .legal-section');
    fadeUpElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        el.classList.add('fade-up');
        observer.observe(el);
    });
    
    // Fade in from left
    const fadeLeftElements = document.querySelectorAll('.why-text, .hero-title, .section-header');
    fadeLeftElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-30px)';
        el.style.transition = `opacity 0.8s ease ${index * 0.15}s, transform 0.8s ease ${index * 0.15}s`;
        el.classList.add('fade-left');
        observer.observe(el);
    });
    
    // Fade in from right
    const fadeRightElements = document.querySelectorAll('.why-image, .hero-description');
    fadeRightElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(30px)';
        el.style.transition = `opacity 0.8s ease ${index * 0.15}s, transform 0.8s ease ${index * 0.15}s`;
        el.classList.add('fade-right');
        observer.observe(el);
    });
    
    // Scale in effect for CTAs and buttons
    const scaleElements = document.querySelectorAll('.cta-button, .cta-group, .footer-cta');
    scaleElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.9)';
        el.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        el.classList.add('scale-in');
        observer.observe(el);
    });
    
    // Parallax effect for hero sections
    const heroSections = document.querySelectorAll('.hero, .blog-hero');
    window.addEventListener('scroll', throttle(function() {
        const scrolled = window.pageYOffset;
        heroSections.forEach(hero => {
            if (scrolled < window.innerHeight) {
                hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }, 16));
    
    // Counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-number, .result-value');
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => statsObserver.observe(stat));
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) translateX(0) scale(1) !important;
        }
        
        .scrolled {
            box-shadow: 0 2px 20px rgba(35, 37, 35, 0.15) !important;
        }
        
        /* Smooth scroll behavior for all elements */
        .fade-up, .fade-left, .fade-right, .scale-in {
            will-change: transform, opacity;
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
            .fade-up, .fade-left, .fade-right, .scale-in {
                transition: none !important;
                opacity: 1 !important;
                transform: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Animate counter for statistics
function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/\D/g, ''));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = element.textContent.replace(/\d+/, target);
            clearInterval(timer);
        } else {
            element.textContent = element.textContent.replace(/\d+/, Math.floor(current));
        }
    }, 16);
}

// Performance optimization: lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// FAQ functionality
function initFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            // Setup ARIA relationships
            const qId = question.id || `faq-q-${Math.random().toString(36).slice(2, 8)}`;
            const aId = answer.id || `faq-a-${Math.random().toString(36).slice(2, 8)}`;
            question.id = qId;
            answer.id = aId;
            question.setAttribute('aria-controls', aId);
            question.setAttribute('aria-expanded', 'false');
            // If not a native button, make it keyboard accessible
            if (question.tagName.toLowerCase() !== 'button' && question.getAttribute('role') !== 'button') {
                question.setAttribute('role', 'button');
                if (!question.hasAttribute('tabindex')) question.setAttribute('tabindex', '0');
            }
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-labelledby', qId);

            const openItem = (el) => {
                el.classList.add('open');
                const q = el.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'true');
            };
            const closeItem = (el) => {
                el.classList.remove('open');
                const q = el.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'false');
            };

            // Initialize closed state
            closeItem(item);

            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                // Close all FAQs
                faqItems.forEach(closeItem);
                // Open clicked if not already open
                if (!isOpen) {
                    openItem(item);
                }
            });

            // Keyboard interaction: Enter/Space toggles
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
        }
    });
}

// Utility function to throttle events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function to debounce events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize lazy loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
    initLazyLoading();
}

// Scroll progress indicator
function initScrollProgress() {
    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', throttle(function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    }, 16));
}

// Parallax effects for hero and image sections
function initParallaxEffects() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // Respect user preference for reduced motion
    }
    
    const parallaxElements = document.querySelectorAll('.why-image img, .hero-container');
    
    if (parallaxElements.length === 0) return;
    
    window.addEventListener('scroll', throttle(function() {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrolled;
            const elementHeight = rect.height;
            
            // Only apply parallax when element is in viewport
            if (scrolled + window.innerHeight > elementTop && scrolled < elementTop + elementHeight) {
                const speed = 0.3 + (index * 0.1); // Different speeds for variety
                const yPos = -(scrolled - elementTop) * speed;
                element.style.transform = `translateY(${yPos}px)`;
            }
        });
    }, 16));
}

// Smooth reveal for sections as they enter viewport
function initSectionReveal() {
    const sections = document.querySelectorAll('section:not(.hero)');
    
    const revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        revealObserver.observe(section);
    });
}

// Call section reveal on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionReveal);
} else {
    initSectionReveal();
}

// Export functions for potential external use
window.VacatAdWebsite = {
    showNotification,
    initNavigation,
    initSmoothScrolling,
    initContactForm,
    initScrollEffects,
    initMobileMenu,
    trackConversion
};