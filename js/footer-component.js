class VacatAdFooter extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const basePath = this.getAttribute('base-path') || '.';
        
        this.innerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h4>VacatAd</h4>
                        <p>Technology-first beneficial occupation resetting relief periods for vacant commercial property.</p>
                        <div class="footer-contact">
                            <p><strong>Email:</strong> <a href="mailto:hello@vacatad.com">hello@vacatad.com</a></p>
                            <p><strong>Phone:</strong> <a href="tel:03330900443">0333 090 0443</a></p>
                        </div>
                        <div class="footer-social">
                            <a href="https://x.com/vacatad" aria-label="VacatAd on X (Twitter)" target="_blank" rel="noopener" class="social-link x">
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                    <path d="M4 4L20 20M20 4L4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/company/vacatad/" aria-label="VacatAd on LinkedIn" target="_blank" rel="noopener" class="social-link linkedin">
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                    <rect x="3" y="9" width="4" height="12" fill="currentColor"/>
                                    <circle cx="5" cy="5" r="2" fill="currentColor"/>
                                    <path d="M16 9a5 5 0 0 1 5 5v7h-4v-7a1 1 0 0 0-1-1 1 1 0 0 0-1 1v7h-4v-7a5 5 0 0 1 5-5z" fill="currentColor"/>
                                </svg>
                            </a>
                            <a href="https://www.facebook.com/vacatad" aria-label="VacatAd on Facebook" target="_blank" rel="noopener" class="social-link facebook">
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="currentColor"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="${basePath}/index.html">Home</a></li>
                            <li><a href="${basePath}/index.html#how-we-work">How We Work</a></li>
                            <li><a href="${basePath}/index.html#why-vacatad">Why VacatAd</a></li>
                            <li><a href="${basePath}/contact.html">Contact</a></li>
                            <li><a href="${basePath}/router-dashboard.html">Client Dashboard</a></li>
                            <li><a href="${basePath}/the-team.html">The Team</a></li>
                        </ul>
                        <h4 style="margin-top: 1.5rem;">Legal</h4>
                        <ul>
                            <li><a href="${basePath}/privacy.html">Privacy Policy</a></li>
                            <li><a href="${basePath}/terms.html">Terms of Service</a></li>
                            <li><a href="${basePath}/gdpr.html">GDPR Policy</a></li>
                            <li><a href="${basePath}/faqs.html">FAQs</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>City Guides</h4>
                        <ul>
                            <li><a href="${basePath}/city/london.html">London</a></li>
                            <li><a href="${basePath}/city/manchester.html">Manchester</a></li>
                            <li><a href="${basePath}/city/birmingham.html">Birmingham</a></li>
                            <li><a href="${basePath}/city/leeds.html">Leeds</a></li>
                            <li><a href="${basePath}/city/liverpool.html">Liverpool</a></li>
                            <li><a href="${basePath}/city/bristol.html">Bristol</a></li>
                            <li><a href="${basePath}/city/sheffield.html">Sheffield</a></li>
                            <li><a href="${basePath}/city/newcastle.html">Newcastle</a></li>
                            <li><a href="${basePath}/city/nottingham.html">Nottingham</a></li>
                            <li><a href="${basePath}/city/leicester.html">Leicester</a></li>
                            <li><a href="${basePath}/city/">All Cities</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Get Started</h4>
                        <a href="${basePath}/contact.html#calculator" class="footer-cta">Calculate Your Savings</a>
                        <p class="footer-tagline">Rapid setup. Real compliance. Proven outcomes.</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2025 VacatAd Ltd. All rights reserved. | Registered in England and Wales | Company No. 15279357</p>
                </div>
            </div>
        </footer>
        `;
    }
}

customElements.define('vacatad-footer', VacatAdFooter);
