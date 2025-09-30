import React, { useState, useRef, useCallback } from 'react';
import { FiArrowRight } from 'react-icons/fi';

const InteractiveFeatureCard = ({
  title,
  description,
  icon: Icon,
  image,
  link,
  linkText = 'Learn More',
  variant = 'default', // 'default', 'glass', 'gradient', 'hover-lift'
  size = 'medium', // 'small', 'medium', 'large'
  color = 'bg-blue-100 text-blue-600',
  hoverColor = 'hover:bg-blue-200',
  metrics,
  className = '',
  onClick,
  disabled = false,
  loading = false,
  animationDelay = 0,
  enableParallax = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);

  // Handle mouse movement for parallax and tilt effects
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !enableParallax) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    setMousePosition({ x, y });
  }, [enableParallax]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    if (onClick) {
      onClick(e);
    } else if (link) {
      if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = link;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-4 min-h-[200px]';
      case 'large':
        return 'p-8 min-h-[400px]';
      default:
        return 'p-6 min-h-[300px]';
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300 ease-out';
    
    switch (variant) {
      case 'glass':
        return `${baseClasses} bg-white/10 backdrop-blur-md border border-white/20 shadow-xl`;
      case 'gradient':
        return `${baseClasses} bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-200/20 shadow-lg`;
      case 'hover-lift':
        return `${baseClasses} bg-white border border-gray-200 shadow-md hover:shadow-2xl hover:-translate-y-2`;
      default:
        return `${baseClasses} bg-white border border-gray-200 shadow-lg hover:shadow-xl`;
    }
  };

  // Get transform styles for parallax and hover effects
  const getTransformStyle = () => {
    if (disabled) return {};
    
    let transform = '';
    
    if (enableParallax && isHovered) {
      const tiltX = mousePosition.y * 5; // Reduced tilt for subtlety
      const tiltY = mousePosition.x * -5;
      transform += `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) `;
    }
    
    if (isHovered && variant === 'hover-lift') {
      transform += 'translateY(-8px) ';
    } else if (isHovered) {
      transform += 'scale(1.02) ';
    }
    
    if (isPressed) {
      transform += 'scale(0.98) ';
    }
    
    return {
      transform: transform.trim() || 'none',
      willChange: 'transform',
    };
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`${getSizeClasses()} ${getVariantClasses()} ${className}`} 
           style={{ animationDelay: `${animationDelay}ms` }}>
        <div className="animate-pulse">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-1"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`
        ${getSizeClasses()} 
        ${getVariantClasses()} 
        rounded-2xl cursor-pointer select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300/50'}
        ${isPressed ? 'ring-2 ring-blue-500/30' : ''}
        animate-fade-in-up
        ${className}
      `}
      style={{
        ...getTransformStyle(),
        animationDelay: `${animationDelay}ms`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
      aria-label={`${title} - ${description}`}
      {...props}
    >
      {/* Background Pattern/Image */}
      {image && (
        <div className="absolute inset-0 opacity-5">
          <img 
            src={image} 
            alt="" 
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Hover Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : ''
        }`}
      />

      {/* Animated Border Gradient */}
      <div 
        className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-20' : ''
        }`} 
        style={{
          padding: '1px',
          background: isHovered 
            ? 'linear-gradient(45deg, #3B82F6, #14B8A6, #3B82F6)' 
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
        }}
      >
        <div className="w-full h-full bg-current rounded-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        {Icon && (
          <div className={`
            flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300
            ${variant === 'glass' ? 'bg-white/20' : color}
            ${isHovered ? 'scale-110 rotate-3' : ''}
            ${isHovered && hoverColor ? hoverColor : ''}
          `}>
            <Icon className={`
              w-8 h-8 transition-all duration-300
            `} />
          </div>
        )}

        {/* Title */}
        <h3 className={`
          font-semibold mb-2 transition-colors duration-300
          ${size === 'large' ? 'text-xl' : size === 'small' ? 'text-base' : 'text-lg'}
          ${variant === 'glass' ? 'text-white' : 'text-gray-900'}
          ${isHovered ? 'text-blue-600' : ''}
        `}>
          {title}
        </h3>

        {/* Description */}
        <p className={`
          flex-grow transition-colors duration-300
          ${size === 'large' ? 'text-base' : 'text-sm'}
          ${variant === 'glass' ? 'text-white/80' : 'text-gray-600'}
          ${isHovered ? 'text-gray-700' : ''}
        `}>
          {description}
        </p>

        {/* Metrics */}
        {metrics && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {metrics.improvement}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {metrics.label}
            </div>
          </div>
        )}

        {/* Action Link */}
        {(link || onClick) && (
          <div className="mt-4 flex items-center justify-between">
            <span className={`
              text-sm font-medium transition-colors duration-300
              ${variant === 'glass' ? 'text-white' : 'text-blue-600'}
              ${isHovered ? 'text-blue-500' : ''}
            `}>
              {linkText}
            </span>
            <FiArrowRight className={`
              w-4 h-4 transition-all duration-300
              ${variant === 'glass' ? 'text-white' : 'text-blue-600'}
              ${isHovered ? 'text-blue-500 translate-x-1' : ''}
            `} />
          </div>
        )}

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 bg-blue-500/30 rounded-full animate-ping" />
          </div>
        )}
      </div>

      {/* Sparkle Effect on Hover */}
      {isHovered && variant === 'glass' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-sparkle opacity-70"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${15 + (i * 10)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      )}

      {/* Loading State Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Feature Card Group Component
export const FeatureCardGroup = ({ 
  features = [], 
  columns = 3, 
  gap = 6, 
  staggerDelay = 100,
  className = '',
  ...props 
}) => {
  const getGridClasses = () => {
    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };
    
    const gapClasses = {
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    };
    
    return `grid ${colClasses[columns] || colClasses[3]} ${gapClasses[gap] || gapClasses[6]}`;
  };

  return (
    <div className={`feature-card-group ${getGridClasses()} ${className}`} {...props}>
      {features.map((feature, index) => (
        <InteractiveFeatureCard
          key={feature.id || index}
          {...feature}
          animationDelay={index * staggerDelay}
        />
      ))}
    </div>
  );
};

// Card variants for specific use cases
export const GlassFeatureCard = (props) => (
  <InteractiveFeatureCard {...props} variant="glass" />
);

export const GradientFeatureCard = (props) => (
  <InteractiveFeatureCard {...props} variant="gradient" />
);

export const HoverLiftFeatureCard = (props) => (
  <InteractiveFeatureCard {...props} variant="hover-lift" />
);

export default InteractiveFeatureCard;