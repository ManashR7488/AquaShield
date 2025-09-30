import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiStar, 
  FiPlay, 
  FiPause 
} from 'react-icons/fi';

const TestimonialCarousel = ({
  testimonials = [],
  autoPlay = true,
  interval = 6000,
  showControls = true,
  showIndicators = true,
  className = '',
  variant = 'default', // 'default', 'cards', 'minimal'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-play functionality
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && !isHovered && testimonials.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, interval);
    }
  }, [isPlaying, isHovered, testimonials.length, interval]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Navigation functions
  const goToTestimonial = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentIndex, isTransitioning]);

  const nextTestimonial = useCallback(() => {
    if (isTransitioning) return;
    const next = (currentIndex + 1) % testimonials.length;
    goToTestimonial(next);
  }, [currentIndex, testimonials.length, goToTestimonial, isTransitioning]);

  const prevTestimonial = useCallback(() => {
    if (isTransitioning) return;
    const prev = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
    goToTestimonial(prev);
  }, [currentIndex, testimonials.length, goToTestimonial, isTransitioning]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevTestimonial();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextTestimonial();
        break;
      case ' ':
        e.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      default:
        break;
    }
  }, [nextTestimonial, prevTestimonial]);

  // Effects
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Render star rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } transition-colors duration-300`}
      />
    ));
  };

  // Render avatar with fallback
  const renderAvatar = (testimonial) => {
    if (testimonial.avatar) {
      return (
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
          loading="lazy"
        />
      );
    }
    
    // Fallback avatar with initials
    const initials = testimonial.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
    
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center border-4 border-white shadow-lg">
        <span className="text-white font-semibold text-lg">{initials}</span>
      </div>
    );
  };

  // Default testimonial card
  const renderDefaultCard = (testimonial, index) => (
    <div
      key={index}
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
        index === currentIndex
          ? 'opacity-100 translate-x-0 scale-100'
          : index < currentIndex
          ? 'opacity-0 -translate-x-full scale-95'
          : 'opacity-0 translate-x-full scale-95'
      }`}
    >
      <div className="max-w-4xl mx-auto text-center px-6">
        <div className="mb-8">
          <blockquote className="text-xl md:text-2xl lg:text-3xl text-gray-700 font-light leading-relaxed mb-8">
            "{testimonial.quote}"
          </blockquote>
          
          <div className="flex justify-center mb-6">
            {renderStars(testimonial.rating || 5)}
          </div>
          
          <div className="flex flex-col items-center">
            {renderAvatar(testimonial)}
            <div className="mt-4">
              <h4 className="font-semibold text-lg text-gray-900">{testimonial.name}</h4>
              <p className="text-gray-600">{testimonial.title}</p>
              {testimonial.company && (
                <p className="text-sm text-gray-500">{testimonial.company}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Card-based layout
  const renderCardLayout = (testimonial, index) => (
    <div
      key={index}
      className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-500 ease-in-out ${
        index === currentIndex
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-8 border border-gray-100">
        <div className="flex justify-center mb-6">
          {renderStars(testimonial.rating || 5)}
        </div>
        
        <blockquote className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
          "{testimonial.quote}"
        </blockquote>
        
        <div className="flex items-center justify-center">
          {renderAvatar(testimonial)}
          <div className="ml-4 text-left">
            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
            <p className="text-gray-600 text-sm">{testimonial.title}</p>
            {testimonial.company && (
              <p className="text-gray-500 text-xs">{testimonial.company}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Minimal layout
  const renderMinimalLayout = (testimonial, index) => (
    <div
      key={index}
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
        index === currentIndex
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4'
      }`}
    >
      <div className="max-w-3xl mx-auto text-center px-6">
        <blockquote className="text-2xl md:text-3xl text-gray-800 font-light mb-8 leading-relaxed">
          "{testimonial.quote}"
        </blockquote>
        
        <div className="flex items-center justify-center space-x-4">
          {renderAvatar(testimonial)}
          <div className="text-left">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
              <div className="flex space-x-1">
                {renderStars(testimonial.rating || 5).slice(0, 5)}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{testimonial.title}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Choose renderer based on variant
  const renderTestimonial = (testimonial, index) => {
    switch (variant) {
      case 'cards':
        return renderCardLayout(testimonial, index);
      case 'minimal':
        return renderMinimalLayout(testimonial, index);
      default:
        return renderDefaultCard(testimonial, index);
    }
  };

  if (!testimonials.length) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-gray-500">
        No testimonials available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-96 md:h-[500px] overflow-hidden group focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="region"
      aria-label="Customer testimonials"
      aria-live="polite"
    >
      {/* Background */}
      <div className={`absolute inset-0 ${
        variant === 'cards' 
          ? 'bg-gradient-to-br from-blue-50 to-teal-50' 
          : variant === 'minimal'
          ? 'bg-gray-50'
          : 'bg-gradient-to-r from-blue-600 to-teal-600'
      }`} />
      
      {/* Content Container */}
      <div className="relative w-full h-full">
        {testimonials.map((testimonial, index) => renderTestimonial(testimonial, index))}
      </div>

      {/* Navigation Controls */}
      {showControls && testimonials.length > 1 && (
        <>
          <button
            onClick={prevTestimonial}
            disabled={isTransitioning}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'cards' || variant === 'minimal'
                ? 'bg-gray-800/20 backdrop-blur-sm hover:bg-gray-800/30 text-gray-800'
                : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
            }`}
            aria-label="Previous testimonial"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextTestimonial}
            disabled={isTransitioning}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'cards' || variant === 'minimal'
                ? 'bg-gray-800/20 backdrop-blur-sm hover:bg-gray-800/30 text-gray-800'
                : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
            }`}
            aria-label="Next testimonial"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && testimonials.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              disabled={isTransitioning}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${
                index === currentIndex
                  ? variant === 'cards' || variant === 'minimal'
                    ? 'bg-blue-600 scale-125 focus:ring-blue-500'
                    : 'bg-white scale-125 focus:ring-white'
                  : variant === 'cards' || variant === 'minimal'
                    ? 'bg-gray-400 hover:bg-gray-600 focus:ring-gray-500'
                    : 'bg-white/50 hover:bg-white/75 focus:ring-white'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Control */}
      {testimonials.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            variant === 'cards' || variant === 'minimal'
              ? 'bg-gray-800/20 backdrop-blur-sm hover:bg-gray-800/30 text-gray-800'
              : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
          }`}
          aria-label={isPlaying ? "Pause testimonials" : "Play testimonials"}
        >
          {isPlaying ? (
            <FiPause className="w-5 h-5" />
          ) : (
            <FiPlay className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Progress Bar */}
      {testimonials.length > 1 && isPlaying && !isHovered && (
        <div className={`absolute bottom-0 left-0 w-full h-1 ${
          variant === 'cards' || variant === 'minimal' ? 'bg-gray-300' : 'bg-white/20'
        }`}>
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              variant === 'cards' || variant === 'minimal' ? 'bg-blue-600' : 'bg-white'
            }`}
            style={{
              width: `${((currentIndex + 1) / testimonials.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
          <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
            variant === 'cards' || variant === 'minimal'
              ? 'border-gray-400 border-t-blue-600'
              : 'border-white/30 border-t-white'
          }`} />
        </div>
      )}
    </div>
  );
};

// Default testimonials data for fallback
export const defaultTestimonials = [
  {
    id: 1,
    quote: "This platform has revolutionized how we monitor water quality in our community. The real-time alerts have helped us prevent several health crises.",
    name: "Dr. Sarah Johnson",
    title: "Public Health Officer",
    company: "City Health Department",
    rating: 5,
    avatar: null,
  },
  {
    id: 2,
    quote: "As an ASHA worker, this app makes my job so much easier. I can quickly report health issues and track community wellness metrics.",
    name: "Priya Sharma",
    title: "ASHA Worker",
    company: "Rural Health Initiative",
    rating: 5,
    avatar: null,
  },
  {
    id: 3,
    quote: "The data analytics provided by this system helped us identify patterns and improve our health intervention strategies significantly.",
    name: "Michael Chen",
    title: "Data Analyst",
    company: "Health Analytics Corp",
    rating: 4,
    avatar: null,
  },
];

export default TestimonialCarousel;