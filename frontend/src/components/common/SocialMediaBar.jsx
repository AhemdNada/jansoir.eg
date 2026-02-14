import React, { useState, useEffect } from 'react';

/**
 * SocialMediaBar Component
 * 
 * Professional floating social media icons bar
 * Placement: Right side, vertically centered
 * 
 * UI/UX Design Decisions:
 * 1. Fixed position on right side - Always visible but doesn't obstruct content
 * 2. Vertical layout - Space-efficient, modern, follows user scroll pattern
 * 3. Subtle default state - Low opacity when not interacting, becomes prominent on hover
 * 4. Smooth animations - Scale transform + glow effect for premium feel
 * 5. Mobile optimized - Smaller size, adjusted position to avoid mobile nav
 * 6. Brand colors with subtle gold accent - Matches luxury e-commerce aesthetic
 * 
 * Responsive Behavior:
 * - Desktop: Right side, centered vertically
 * - Mobile: Smaller icons, slightly adjusted position above bottom nav
 */

const SocialMediaBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  // Detect mobile and handle visibility
  useEffect(() => {
    // Hide on scroll down for mobile (to avoid conflict with bottom nav)
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (window.innerWidth < 768) {
        if (currentScroll > lastScroll && currentScroll > 100) {
          setIsVisible(false);
        } else if (currentScroll < lastScroll || currentScroll <= 100) {
          setIsVisible(true);
        }
      }
      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Social media links - Replace with your actual URLs
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/jansoir_fragrance?igsh=MWk5ZG9jdWo1YmMxdg%3D%3D&utm_source=qr', // Replace with your Instagram
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'hover:text-[#E4405F]', // Instagram brand color
      bgColor: 'hover:bg-[#E4405F]/10',
    },
    {
      name: 'WhatsApp',
      url: 'https://tr.ee/46t02Tc85p', // Replace with your WhatsApp number (country code + number, no +)
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
      color: 'hover:text-[#25D366]', // WhatsApp brand color
      bgColor: 'hover:bg-[#25D366]/10',
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@jansoir_fragrance?_r=1&_t=ZS-93tSIUxGvsi', // Replace with your TikTok
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      color: 'hover:text-[#EE1D52]', // TikTok brand color (black, but we'll use gold hover)
      bgColor: 'hover:bg-[#000000]/10',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/people/Jansoir-Fragrances/61585994795168/?mibextid=wwXIfr&rdid=zSyVoL3clRieC2h9&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AY2Bkt9q4%2F%3Fmibextid%3DwwXIfr', // Replace with your Facebook
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'hover:text-[#1877F2]', // Facebook brand color
      bgColor: 'hover:bg-[#1877F2]/10',
    },
  ];

  const handleClick = (e, url) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop Version - Right Side Vertical Bar */}
      <aside
        className={`
          fixed right-0 top-1/2 -translate-y-1/2 z-40
          hidden md:flex flex-col items-center gap-3
          px-2 py-4
          bg-dark-base/80 backdrop-blur-sm
          border-l border-t border-b border-woody/30
          rounded-l-2xl
          shadow-2xl
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
        aria-label="Social Media Links"
      >
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            onClick={(e) => handleClick(e, social.url)}
            onMouseEnter={() => setHoveredIcon(social.name)}
            onMouseLeave={() => setHoveredIcon(null)}
            className={`
              relative
              w-12 h-12
              flex items-center justify-center
              rounded-xl
              bg-dark-light/50
              border border-woody/30
              text-beige/60
              transition-all duration-300 ease-out
              ${social.color}
              ${social.bgColor}
              ${hoveredIcon === social.name 
                ? 'scale-110 text-gold border-gold/50 shadow-lg shadow-gold/20 transform translate-x-[-2px]' 
                : 'hover:scale-105 hover:text-gold/80 hover:border-gold/30'
              }
              group
              focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-dark-base
            `}
            aria-label={`Follow us on ${social.name}`}
            title={social.name}
          >
            {/* Icon */}
            <div className="w-6 h-6 transform transition-transform duration-300 group-hover:scale-110">
              {social.icon}
            </div>

            {/* Tooltip */}
            <span
              className={`
                absolute right-full mr-3
                px-3 py-1.5
                bg-dark-light border border-woody
                text-beige text-sm font-medium
                whitespace-nowrap
                rounded-lg
                shadow-lg
                pointer-events-none
                transition-all duration-300 ease-out
                ${hoveredIcon === social.name 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-2'
                }
              `}
            >
              {social.name}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-woody border-b-4 border-b-transparent"></span>
            </span>

            {/* Subtle glow effect on hover */}
            <span
              className={`
                absolute inset-0 rounded-xl
                bg-gold/0
                transition-all duration-300
                ${hoveredIcon === social.name ? 'bg-gold/5 shadow-inner' : ''}
              `}
            />
          </a>
        ))}

        {/* Optional: Vertical divider line */}
        <div className="w-8 h-px bg-woody/30 mt-2" />
      </aside>

      {/* Mobile Version - Bottom Right Corner (Above Bottom Nav) */}
      <aside
        className={`
          fixed bottom-20 right-4 z-40
          md:hidden flex flex-row items-center gap-2
          px-3 py-2
          bg-dark-base/90 backdrop-blur-md
          border border-woody/40
          rounded-full
          shadow-2xl
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
        `}
        aria-label="Social Media Links"
      >
        {socialLinks.map((social) => (
          <a
            key={`mobile-${social.name}`}
            href={social.url}
            onClick={(e) => handleClick(e, social.url)}
            onTouchStart={() => setHoveredIcon(social.name)}
            onTouchEnd={() => setHoveredIcon(null)}
            className={`
              relative
              w-10 h-10
              flex items-center justify-center
              rounded-full
              bg-dark-light/60
              border border-woody/40
              text-beige/70
              transition-all duration-200 ease-out
              ${social.color}
              ${social.bgColor}
              ${hoveredIcon === social.name 
                ? 'scale-110 text-gold border-gold/50 shadow-md shadow-gold/20' 
                : 'active:scale-95'
              }
              focus:outline-none focus:ring-2 focus:ring-gold/50
            `}
            aria-label={`Follow us on ${social.name}`}
            title={social.name}
          >
            {/* Icon - Smaller for mobile */}
            <div className="w-5 h-5 transform transition-transform duration-200">
              {social.icon}
            </div>
          </a>
        ))}
      </aside>
    </>
  );
};

export default SocialMediaBar;
