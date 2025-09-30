import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for Intersection Observer functionality
 * Provides efficient viewport detection with configurable options
 * 
 * @param {Object} options - Configuration options
 * @param {number|number[]} options.threshold - Intersection threshold(s) (0-1)
 * @param {string} options.rootMargin - Root margin for early/late triggering
 * @param {Element} options.root - Root element for intersection (default: viewport)
 * @param {boolean} options.triggerOnce - Only trigger once when entering viewport
 * @param {boolean} options.enabled - Whether observer is enabled
 * @param {Function} options.onEnter - Callback when element enters viewport
 * @param {Function} options.onExit - Callback when element exits viewport
 * @param {Function} options.onChange - Callback on any intersection change
 * @param {number} options.delay - Delay before triggering callbacks (ms)
 * @param {boolean} options.respectReducedMotion - Respect user's motion preferences
 */
const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  root = null,
  triggerOnce = false,
  enabled = true,
  onEnter,
  onExit,
  onChange,
  delay = 0,
  respectReducedMotion = true,
} = {}) => {
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [entry, setEntry] = useState(null);

  // Check for reduced motion preference
  const prefersReducedMotion = respectReducedMotion && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intersection Observer callback
  const handleIntersection = useCallback((entries) => {
    const [intersectionEntry] = entries;
    const { isIntersecting: intersecting, intersectionRatio: ratio } = intersectionEntry;
    
    setEntry(intersectionEntry);
    setIntersectionRatio(ratio);

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const executeCallbacks = () => {
      setIsIntersecting(intersecting);
      
      if (intersecting) {
        setHasIntersected(true);
        onEnter && onEnter(intersectionEntry);
      } else {
        onExit && onExit(intersectionEntry);
      }
      
      onChange && onChange(intersectionEntry);
    };

    // Apply delay if specified
    if (delay > 0 && !prefersReducedMotion) {
      timeoutRef.current = setTimeout(executeCallbacks, delay);
    } else {
      executeCallbacks();
    }
  }, [onEnter, onExit, onChange, delay, prefersReducedMotion]);

  // Initialize observer
  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    
    // If triggerOnce and already intersected, don't observe
    if (triggerOnce && hasIntersected) return;

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      root,
    });

    // Start observing
    observerRef.current.observe(element);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element);
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, threshold, rootMargin, root, triggerOnce, hasIntersected, handleIntersection]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    if (elementRef.current && enabled) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold,
        rootMargin,
        root,
      });
      observerRef.current.observe(elementRef.current);
    }
  }, [enabled, threshold, rootMargin, root, handleIntersection, disconnect]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    intersectionRatio,
    entry,
    disconnect,
    reconnect,
  };
};

/**
 * Hook for multiple elements intersection observation
 * 
 * @param {Object} options - Configuration options (same as useIntersectionObserver)
 * @returns {Object} - Observer utilities and state
 */
export const useMultipleIntersectionObserver = (options = {}) => {
  const observerRef = useRef(null);
  const elementsRef = useRef(new Map());
  const [intersections, setIntersections] = useState(new Map());

  const handleIntersection = useCallback((entries) => {
    const newIntersections = new Map(intersections);
    
    entries.forEach((entry) => {
      const elementId = entry.target.dataset.observerId;
      newIntersections.set(elementId, {
        isIntersecting: entry.isIntersecting,
        intersectionRatio: entry.intersectionRatio,
        entry,
      });
    });
    
    setIntersections(newIntersections);
    options.onChange && options.onChange(entries);
  }, [intersections, options]);

  useEffect(() => {
    if (!options.enabled) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px',
      root: options.root || null,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, options.enabled, options.threshold, options.rootMargin, options.root]);

  const observe = useCallback((element, id) => {
    if (!element || !observerRef.current) return;
    
    element.dataset.observerId = id;
    elementsRef.current.set(id, element);
    observerRef.current.observe(element);
  }, []);

  const unobserve = useCallback((id) => {
    const element = elementsRef.current.get(id);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
      elementsRef.current.delete(id);
      setIntersections((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  }, []);

  return {
    observe,
    unobserve,
    intersections,
    disconnect: () => observerRef.current?.disconnect(),
  };
};

/**
 * Hook for scroll-triggered animations
 * Combines intersection observer with animation states
 */
export const useScrollAnimation = ({
  threshold = 0.2,
  rootMargin = '-50px',
  triggerOnce = true,
  animationClass = 'animate-fade-in-up',
  delay = 0,
  stagger = 0,
} = {}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // 'idle', 'ready', 'animating', 'complete'

  const { elementRef, isIntersecting, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce,
    delay,
    onEnter: () => {
      setAnimationState('ready');
      setTimeout(() => {
        setShouldAnimate(true);
        setAnimationState('animating');
      }, stagger);
    },
    onChange: (entry) => {
      if (entry.isIntersecting && shouldAnimate) {
        setAnimationState('complete');
      }
    },
  });

  const animationClasses = [
    shouldAnimate ? animationClass : '',
    animationState,
  ].filter(Boolean).join(' ');

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    shouldAnimate,
    animationState,
    animationClasses,
  };
};

/**
 * Hook for lazy loading with intersection observer
 */
export const useLazyLoad = ({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
} = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce,
    onEnter: () => {
      if (!isLoaded && !isLoading) {
        setIsLoading(true);
        // Simulate loading delay or use with actual loading logic
        setTimeout(() => {
          setIsLoaded(true);
          setIsLoading(false);
        }, 100);
      }
    },
  });

  return {
    elementRef,
    isIntersecting,
    isLoaded,
    isLoading,
    shouldLoad: isIntersecting && !isLoaded,
  };
};

/**
 * Hook for parallax effects with intersection observer
 */
export const useParallax = ({
  threshold = [0, 0.5, 1],
  speed = 0.5,
  enabled = true,
} = {}) => {
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  const { elementRef, intersectionRatio, isIntersecting } = useIntersectionObserver({
    threshold,
    enabled,
    onChange: (entry) => {
      if (isIntersecting) {
        const offset = (entry.intersectionRatio - 0.5) * speed * 100;
        setParallaxOffset(offset);
      }
    },
  });

  const parallaxStyle = {
    transform: `translateY(${parallaxOffset}px)`,
    willChange: isIntersecting ? 'transform' : 'auto',
  };

  return {
    elementRef,
    parallaxStyle,
    parallaxOffset,
    isIntersecting,
  };
};

/**
 * Hook for viewport-based counters and progress bars
 */
export const useViewportTrigger = ({
  threshold = 0.5,
  triggerOnce = true,
  delay = 0,
} = {}) => {
  const [isTriggered, setIsTriggered] = useState(false);
  const [progress, setProgress] = useState(0);

  const { elementRef, isIntersecting, intersectionRatio } = useIntersectionObserver({
    threshold: Array.isArray(threshold) ? threshold : [0, threshold, 1],
    triggerOnce,
    delay,
    onEnter: () => {
      setIsTriggered(true);
    },
    onChange: (entry) => {
      setProgress(entry.intersectionRatio);
    },
  });

  return {
    elementRef,
    isTriggered,
    isIntersecting,
    progress,
    progressPercentage: Math.round(progress * 100),
  };
};

export default useIntersectionObserver;