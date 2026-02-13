import React from 'react';

const Loader = ({ fullscreen = false, label = 'Loading...', size = 'default' }) => {
  // Responsive size classes for different screen sizes
  const sizeClasses = {
    small: 'h-6 w-6 border-2 sm:h-8 sm:w-8 sm:border-[3px]',
    default: 'h-10 w-10 border-[3px] sm:h-12 sm:w-12 sm:border-4 md:h-14 md:w-14 md:border-[5px] lg:h-16 lg:w-16',
    large: 'h-16 w-16 border-4 sm:h-20 sm:w-20 sm:border-[5px] md:h-24 md:w-24 md:border-[6px] lg:h-28 lg:w-28'
  };

  const loaderSize = sizeClasses[size] || sizeClasses.default;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full min-h-screen bg-white bg-opacity-90" role="status" aria-live="polite">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`${loaderSize} animate-spin rounded-full border-gray-200 border-t-[brand] transition-all duration-300`} />
          {label && label !== 'Loading...' && (
            <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">{label}</p>
          )}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4 sm:py-6 md:py-8 w-full min-h-[200px] sm:min-h-[250px]" role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
        <div className={`${loaderSize} animate-spin rounded-full border-gray-200 border-t-[brand] transition-all duration-300`} />
        {label && label !== 'Loading...' && (
          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">{label}</p>
        )}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Loader;

