import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlay, 
  FiPause,
  FiArrowRight
} from 'react-icons/fi';

const HeroCarousel = ({ slides = [], autoPlay = true, interval = 5000, className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  // Auto-play functionality
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && !isHovered && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, interval);
    }
  }, [isPlaying, isHovered, slides.length, interval]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Navigation functions
  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  }, [currentSlide, slides.length, goToSlide, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    const prev = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    goToSlide(prev);
  }, [currentSlide, slides.length, goToSlide, isTransitioning]);

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextSlide();
        break;
      case ' ':
        e.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      default:
        break;
    }
  }, [nextSlide, prevSlide]);

  // Effects
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('keydown', handleKeyDown);
      return () => carousel.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Preload next and previous images
  useEffect(() => {
    if (slides.length > 1) {
      const nextIndex = (currentSlide + 1) % slides.length;
      const prevIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
      
      [nextIndex, prevIndex].forEach(index => {
        if (slides[index]?.image) {
          const img = new Image();
          img.src = slides[index].image;
        }
      });
    }
  }, [currentSlide, slides]);

  if (!slides.length) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center">
        <div className="text-white text-lg">No slides available</div>
      </div>
    );
  }

  return (
    <div 
      ref={carouselRef}
      className={`relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden group focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${
              index === currentSlide
                ? 'opacity-100 translate-x-0 scale-100'
                : index < currentSlide
                ? 'opacity-0 -translate-x-full scale-95'
                : 'opacity-0 translate-x-full scale-95'
            }`}
            style={{
              willChange: 'transform, opacity',
              transform: `translate3d(${index === currentSlide ? '0' : index < currentSlide ? '-100%' : '100%'}, 0, 0)`,
            }}
          >
            {/* Background */}
            {slide.image ? (
              <>
                <img
                  src={slide.image}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index <= 1 ? "eager" : "lazy"}
                />
                {slide.gradient && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-90`} />
                )}
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${slide.gradient || 'from-blue-900 via-indigo-800 to-purple-900'}`} />
            )}
            
            {/* Enhanced Overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/30" />
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-5xl px-6 text-white">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up drop-shadow-2xl" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 animate-fade-in-up animation-delay-200 drop-shadow-lg max-w-4xl mx-auto" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
                    {slide.subtitle}
                  </p>
                )}
                {slide.cta && (
                  <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-400 mt-10">
                    {slide.cta.primary && (
                      <button
                        onClick={slide.cta.primary.action}
                        className="inline-flex items-center px-10 py-4 bg-white text-blue-700 font-bold text-lg rounded-full hover:bg-blue-50 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl border-2 border-white"
                      >
                        {slide.cta.primary.text}
                        <FiArrowRight className="ml-3 w-6 h-6" />
                      </button>
                    )}
                    {slide.cta.secondary && (
                      <button
                        onClick={slide.cta.secondary.action}
                        className="inline-flex items-center px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white font-bold text-lg rounded-full hover:bg-white hover:text-blue-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl"
                      >
                        <FiPlay className="mr-3 w-6 h-6" />
                        {slide.cta.secondary.text}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed ${
                index === currentSlide
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Control */}
      {slides.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <FiPause className="w-5 h-5" />
          ) : (
            <FiPlay className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Progress Bar */}
      {slides.length > 1 && isPlaying && !isHovered && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Loading Indicator */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;