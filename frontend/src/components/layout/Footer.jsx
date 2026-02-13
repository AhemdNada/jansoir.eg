import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-base border-t border-woody text-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)] gap-8 items-start">
          {/* Brand / Identity + Quick Links */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/images/icon-title.webp" 
                  alt="Jansoir.eg Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover flex-shrink-0 shadow-[0_0_20px_rgba(201,162,77,0.35)] border border-gold/60"
                />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-gold tracking-wide">
                      Jansoir
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-beige">
                      .eg
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.4em] font-light text-beige/70 uppercase mt-0.5 whitespace-nowrap">
                    F R A G R A N C E
                  </span>
                </div>
              </Link>
              <p className="text-beige/75 text-xs sm:text-sm max-w-md leading-relaxed">
                Discover curated fragrances and premium scents, crafted for a smooth online experience across all your devices.
              </p>
            </div>

            {/* Minimal navigation */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mt-2">
              <Link
                to="/products"
                className="px-3 py-1.5 rounded-full border border-woody bg-dark-base/60 text-[11px] sm:text-xs text-beige/80 hover:border-gold hover:text-gold transition-colors"
              >
                Shop All
              </Link>
              <Link
                to="/customize"
                className="px-3 py-1.5 rounded-full border border-woody bg-dark-base/60 text-[11px] sm:text-xs text-beige/80 hover:border-gold hover:text-gold transition-colors"
              >
                Customize
              </Link>
              
            </div>
          </div>

          {/* Connect With Us */}
          <div className="w-full md:w-auto text-center md:text-right">
            <h3 className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase mb-3 text-gold">
              Connect With Us
            </h3>
            <div className="flex items-center justify-center md:justify-end gap-3 sm:gap-4 mb-4 text-beige/80">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-woody bg-dark-base/70 flex items-center justify-center hover:border-gold hover:text-gold transition-colors focus:outline-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="#"
                aria-label="TikTok"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-woody bg-dark-base/70 flex items-center justify-center hover:border-gold hover:text-gold transition-colors focus:outline-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M16.5 3H14a.5.5 0 0 0-.5.5v9.32a2.77 2.77 0 0 1-2.46 2.78A2.75 2.75 0 0 1 8.2 13.2a2.76 2.76 0 0 1 2.38-2.72.5.5 0 0 0 .42-.49V7.05a.5.5 0 0 0-.61-.49A5.27 5.27 0 0 0 6 11.9a5.25 5.25 0 0 0 5.46 5.23 5.28 5.28 0 0 0 5-5.29V9.08a5.29 5.29 0 0 0 3 1v-2.6a.5.5 0 0 0-.46-.5 2.82 2.82 0 0 1-2.5-2.63A.5.5 0 0 0 16.5 3Z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="#"
                aria-label="WhatsApp"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-woody bg-dark-base/70 flex items-center justify-center hover:border-gold hover:text-gold transition-colors focus:outline-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M20.52 3.48A11.942 11.942 0 0012 0C5.373 0 0 5.373 0 12c0 2.12.555 4.098 1.608 5.833L0 24l6.348-1.59A11.936 11.936 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.24-6.18-3.48-8.52zM12 21.818c-1.79 0-3.524-.467-5.043-1.354l-.36-.21-3.775.945.99-3.676-.236-.378A9.818 9.818 0 012.182 12c0-5.421 4.397-9.818 9.818-9.818 5.421 0 9.818 4.397 9.818 9.818 0 5.42-4.397 9.818-9.818 9.818zM16.08 14.64c-.22-.11-1.3-.64-1.5-.71-.2-.07-.35-.11-.5.11s-.57.71-.7.86c-.13.14-.25.16-.47.05-.22-.11-.93-.34-1.77-1.08-.65-.58-1.08-1.3-1.2-1.52-.13-.22-.014-.34.1-.45.1-.1.22-.27.33-.4.11-.13.15-.22.22-.36.07-.13.035-.27-.018-.38-.054-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38l-.43-.01c-.14 0-.36.05-.55.27s-.72.7-.72 1.71c0 1 .74 1.97.84 2.11.11.13 1.45 2.22 3.5 3.11.49.21.87.33 1.17.42.49.15.94.13 1.29.08.39-.06 1.3-.53 1.49-1.04.2-.51.2-.95.14-1.04-.06-.09-.22-.14-.44-.25z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-woody bg-dark-base/70 flex items-center justify-center hover:border-gold hover:text-gold transition-colors focus:outline-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
            
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-woody mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-beige/65 text-xs sm:text-sm text-center md:text-left">
              © {new Date().getFullYear()} Jansoir.eg. All rights reserved.
            </p>
            <span className="text-beige/50 text-[11px] sm:text-xs">
              Crafted with care for a smoother shopping experience.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;