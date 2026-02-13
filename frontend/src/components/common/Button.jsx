import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group';

  const variantStyles = {
    primary: 'bg-gold text-dark-base hover:bg-gold-light border border-gold',
    navigation: 'bg-dark-light text-beige hover:bg-gold hover:text-dark-base rounded-full shadow-md border border-woody',
    secondary: 'bg-woody text-beige hover:bg-woody-light',
    danger: 'bg-gold text-dark-base hover:bg-gold-light',
    viewAll: 'bg-dark-light text-beige hover:bg-gold hover:text-dark-base border border-woody hover:border-gold rounded-md shadow-sm hover:shadow-md',
    outline: 'bg-dark-light text-beige hover:bg-gold hover:text-dark-base border border-gold rounded-full',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'w-10 h-10', // For navigation buttons
  };

  const getVariantClass = () => {
    if (variant === 'navigation') {
      return variantStyles.navigation;
    }
    return variantStyles[variant] || variantStyles.primary;
  };

  const getSizeClass = () => {
    if (variant === 'navigation') {
      return sizeStyles.icon;
    }
    return sizeStyles[size] || sizeStyles.md;
  };

  const classes = `${baseStyles} ${getVariantClass()} ${getSizeClass()} ${className}`;

  // Navigation button variant (for prev/next)
  if (variant === 'navigation') {
    const iconToShow = icon === 'prev' ? faChevronLeft : icon === 'next' ? faChevronRight : icon;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled}
        {...props}
      >
        {iconToShow && (
          <FontAwesomeIcon
            icon={iconToShow}
            className="w-3 h-3"
          />
        )}
        {children}
      </button>
    );
  }

  // Regular button
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="mr-2">
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={`ml-2 transition-transform duration-300 ${variant === 'viewAll' ? 'group-hover:translate-x-1' : ''}`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;