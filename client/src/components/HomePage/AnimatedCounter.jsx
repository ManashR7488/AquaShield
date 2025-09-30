import React, { useState, useEffect, useRef, useCallback } from 'react';

const AnimatedCounter = ({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
  onComplete,
  trigger = true,
  easingFunction = 'easeOutCubic',
  staggerDelay = 0,
  formatterFunction,
  enableHover = true,
  enableReducedMotion = true,
  ariaLabel,
  ...props
}) => {
  const [current, setCurrent] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const animationRef = useRef(null);
  const elementRef = useRef(null);
  const startTimeRef = useRef(null);

  // Easing functions
  const easingFunctions = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  };

  // Format number with separators
  const formatNumber = useCallback((num) => {
    if (formatterFunction) {
      return formatterFunction(num);
    }

    const fixedNum = Number(num).toFixed(decimals);
    const parts = fixedNum.split('.');
    
    // Add thousand separators
    if (separator && parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    
    const formattedNum = parts.join('.');
    return `${prefix}${formattedNum}${suffix}`;
  }, [decimals, prefix, suffix, separator, formatterFunction]);

  // Animation function
  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing function
    const easedProgress = easingFunctions[easingFunction] 
      ? easingFunctions[easingFunction](progress)
      : progress;

    // Calculate current value
    const currentValue = start + (end - start) * easedProgress;
    setCurrent(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      setHasAnimated(true);
      startTimeRef.current = null;
      if (onComplete) {
        onComplete(end);
      }
    }
  }, [start, end, duration, easingFunction, onComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (isAnimating || hasAnimated) return;

    // Check for reduced motion preference
    if (enableReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(end);
      setHasAnimated(true);
      if (onComplete) {
        onComplete(end);
      }
      return;
    }

    setIsAnimating(true);
    startTimeRef.current = null;

    const startWithDelay = () => {
      animationRef.current = requestAnimationFrame(animate);
    };

    if (staggerDelay > 0) {
      setTimeout(startWithDelay, staggerDelay);
    } else {
      startWithDelay();
    }
  }, [isAnimating, hasAnimated, enableReducedMotion, end, onComplete, staggerDelay, animate]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCurrent(start);
    setIsAnimating(false);
    setHasAnimated(false);
    startTimeRef.current = null;
  }, [start]);

  // Handle trigger
  useEffect(() => {
    if (trigger && !hasAnimated) {
      startAnimation();
    }
  }, [trigger, hasAnimated, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle hover effects
  const handleMouseEnter = () => {
    if (enableHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (enableHover) {
      setIsHovered(false);
    }
  };

  // Get animation state class
  const getStateClass = () => {
    if (isAnimating) return 'animating';
    if (hasAnimated) return 'completed';
    return 'idle';
  };

  return (
    <span
      ref={elementRef}
      className={`animated-counter ${getStateClass()} ${isHovered ? 'hovered' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel || `${formatNumber(current)}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span 
        className={`counter-value transition-all duration-300 ${
          isHovered ? 'scale-110 text-blue-600' : ''
        } ${
          isAnimating ? 'animate-pulse' : ''
        }`}
      >
        {formatNumber(current)}
      </span>
      
      {/* Loading indicator for animation */}
      {isAnimating && (
        <span className="ml-2 inline-block">
          <span className="inline-flex space-x-1">
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </span>
      )}

      {/* Progress indicator */}
      {isAnimating && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-100 ease-out" 
             style={{ width: `${((current - start) / (end - start)) * 100}%` }} />
      )}
    </span>
  );
};

// Preset configurations for common use cases
export const CounterPresets = {
  percentage: {
    suffix: '%',
    decimals: 1,
    easingFunction: 'easeOutCubic',
  },
  currency: {
    prefix: '$',
    separator: ',',
    decimals: 2,
    easingFunction: 'easeOutQuart',
  },
  large: {
    formatterFunction: (num) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toFixed(0);
    },
    easingFunction: 'easeOutCubic',
  },
  duration: {
    formatterFunction: (num) => {
      const hours = Math.floor(num / 3600);
      const minutes = Math.floor((num % 3600) / 60);
      const seconds = Math.floor(num % 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    },
    easingFunction: 'linear',
  },
};

// Higher-order component for automatic intersection observer integration
export const AnimatedCounterWithObserver = ({ 
  threshold = 0.5, 
  rootMargin = '0px',
  triggerOnce = true,
  ...counterProps 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!triggerOnce || !isVisible)) {
            setIsVisible(true);
          }
        });
      },
      { threshold, rootMargin }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, isVisible]);

  return (
    <div ref={elementRef}>
      <AnimatedCounter {...counterProps} trigger={isVisible} />
    </div>
  );
};

// Batch counter component for multiple counters
export const CounterGroup = ({ 
  counters = [], 
  staggerDelay = 200, 
  className = '',
  ...groupProps 
}) => {
  return (
    <div className={`counter-group ${className}`} {...groupProps}>
      {counters.map((counter, index) => (
        <AnimatedCounter
          key={counter.id || index}
          {...counter}
          staggerDelay={index * staggerDelay}
        />
      ))}
    </div>
  );
};

export default AnimatedCounter;