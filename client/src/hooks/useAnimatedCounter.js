import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom hook for animated counter functionality
 * Provides smooth number animation with configurable options
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.start - Starting value
 * @param {number} options.end - Ending value
 * @param {number} options.duration - Animation duration in milliseconds
 * @param {boolean} options.autoStart - Whether to start animation automatically
 * @param {string} options.easing - Easing function name
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {Function} options.onUpdate - Callback on each frame update
 * @param {boolean} options.respectReducedMotion - Respect user's motion preferences
 * @param {number} options.precision - Number of decimal places
 */
const useAnimatedCounter = ({
  start = 0,
  end = 100,
  duration = 2000,
  autoStart = false,
  easing = 'easeOutCubic',
  onComplete,
  onUpdate,
  respectReducedMotion = true,
  precision = 0,
} = {}) => {
  const [current, setCurrent] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const isPausedRef = useRef(false);

  // Easing functions
  const easingFunctions = useMemo(() => ({
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
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t) => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
    easeInOutCirc: (t) => t < 0.5 
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 
      : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
    easeInElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInBack: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutBounce: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    },
  }), []);

  // Check for reduced motion preference
  const prefersReducedMotion = respectReducedMotion && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animation function
  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    if (isPausedRef.current) {
      startTimeRef.current = timestamp - pausedTimeRef.current;
      return;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing function
    const easingFn = easingFunctions[easing] || easingFunctions.easeOutCubic;
    const easedProgress = easingFn(progress);

    // Calculate current value
    const currentValue = start + (end - start) * easedProgress;
    const roundedValue = Math.round(currentValue * Math.pow(10, precision)) / Math.pow(10, precision);
    
    setCurrent(roundedValue);
    setProgress(progress);
    
    // Call update callback
    onUpdate && onUpdate(roundedValue, progress);

    if (progress < 1 && !isPausedRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      setHasCompleted(true);
      startTimeRef.current = null;
      onComplete && onComplete(end);
    }
  }, [start, end, duration, easing, easingFunctions, onComplete, onUpdate, precision]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (isAnimating) return;

    // Handle reduced motion
    if (prefersReducedMotion) {
      setCurrent(end);
      setProgress(1);
      setHasCompleted(true);
      onComplete && onComplete(end);
      return;
    }

    setIsAnimating(true);
    setHasCompleted(false);
    startTimeRef.current = null;
    isPausedRef.current = false;
    pausedTimeRef.current = 0;
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, prefersReducedMotion, end, onComplete, animate]);

  // Pause animation
  const pauseAnimation = useCallback(() => {
    if (!isAnimating || isPausedRef.current) return;
    
    isPausedRef.current = true;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isAnimating]);

  // Resume animation
  const resumeAnimation = useCallback(() => {
    if (!isPausedRef.current) return;
    
    isPausedRef.current = false;
    pausedTimeRef.current = performance.now() - startTimeRef.current;
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Stop and reset animation
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setProgress(0);
    setHasCompleted(false);
    setCurrent(start);
    startTimeRef.current = null;
    isPausedRef.current = false;
    pausedTimeRef.current = 0;
  }, [start]);

  // Reset to start value
  const reset = useCallback(() => {
    stopAnimation();
    setCurrent(start);
    setProgress(0);
    setHasCompleted(false);
  }, [start, stopAnimation]);

  // Update target value (useful for real-time updates)
  const updateTarget = useCallback((newEnd) => {
    if (isAnimating) {
      // Smoothly transition to new target
      const currentStart = current;
      setCurrent(currentStart);
      // Restart with new target
      stopAnimation();
      setTimeout(() => {
        startAnimation();
      }, 50);
    }
  }, [current, isAnimating, stopAnimation, startAnimation]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !hasCompleted) {
      startAnimation();
    }
  }, [autoStart, hasCompleted, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Return state and controls
  return {
    current,
    progress,
    isAnimating,
    hasCompleted,
    isPaused: isPausedRef.current,
    start: startAnimation,
    pause: pauseAnimation,
    resume: resumeAnimation,
    stop: stopAnimation,
    reset,
    updateTarget,
  };
};

/**
 * Hook for batch counter animations with staggered timing
 */
export const useStaggeredCounters = (counters = [], staggerDelay = 200) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allCompleted, setAllCompleted] = useState(false);
  
  const counterStates = counters.map((config, index) => 
    useAnimatedCounter({
      ...config,
      autoStart: false,
      onComplete: () => {
        config.onComplete && config.onComplete();
        if (index === counters.length - 1) {
          setAllCompleted(true);
        }
      },
    })
  );

  const startStaggered = useCallback(() => {
    setActiveIndex(0);
    setAllCompleted(false);
    
    counters.forEach((_, index) => {
      setTimeout(() => {
        counterStates[index].start();
        setActiveIndex(index);
      }, index * staggerDelay);
    });
  }, [counters, counterStates, staggerDelay]);

  const stopAll = useCallback(() => {
    counterStates.forEach(counter => counter.stop());
    setActiveIndex(-1);
    setAllCompleted(false);
  }, [counterStates]);

  const resetAll = useCallback(() => {
    counterStates.forEach(counter => counter.reset());
    setActiveIndex(-1);
    setAllCompleted(false);
  }, [counterStates]);

  return {
    counters: counterStates,
    activeIndex,
    allCompleted,
    startStaggered,
    stopAll,
    resetAll,
  };
};

/**
 * Hook for counter with formatting utilities
 */
export const useFormattedCounter = ({
  prefix = '',
  suffix = '',
  separator = ',',
  decimals = 0,
  formatFunction,
  ...counterOptions
}) => {
  const counter = useAnimatedCounter(counterOptions);

  const formattedValue = useMemo(() => {
    if (formatFunction) {
      return formatFunction(counter.current);
    }

    const fixedNum = Number(counter.current).toFixed(decimals);
    const parts = fixedNum.split('.');
    
    // Add thousand separators
    if (separator && parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    
    const formattedNum = parts.join('.');
    return `${prefix}${formattedNum}${suffix}`;
  }, [counter.current, prefix, suffix, separator, decimals, formatFunction]);

  return {
    ...counter,
    formattedValue,
    rawValue: counter.current,
  };
};

/**
 * Hook for percentage counter with progress visualization
 */
export const usePercentageCounter = ({
  max = 100,
  showProgress = true,
  color = '#3B82F6',
  ...counterOptions
}) => {
  const counter = useAnimatedCounter({
    ...counterOptions,
    end: Math.min(counterOptions.end || 100, max),
  });

  const percentage = useMemo(() => {
    return Math.round((counter.current / max) * 100);
  }, [counter.current, max]);

  const progressStyle = useMemo(() => ({
    width: `${percentage}%`,
    backgroundColor: color,
    transition: 'width 0.3s ease',
  }), [percentage, color]);

  return {
    ...counter,
    percentage,
    progressStyle,
    isComplete: counter.current >= max,
  };
};

export default useAnimatedCounter;