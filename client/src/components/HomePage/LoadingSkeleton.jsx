import React from 'react';

/**
 * LoadingSkeleton Component - Provides loading skeletons for HomePage
 * Includes various skeleton types with animations, responsive design,
 * accessibility features, and performance optimization
 */

// Base skeleton component with shimmer effect
const SkeletonBase = ({ 
  className = '', 
  width, 
  height, 
  rounded = false, 
  animate = true,
  ...props 
}) => {
  const shimmerClass = animate ? 'animate-shimmer' : '';
  const roundedClass = rounded === true ? 'rounded-full' : 
                     rounded === 'lg' ? 'rounded-lg' : 
                     rounded === 'xl' ? 'rounded-xl' : 
                     rounded === '2xl' ? 'rounded-2xl' : 
                     rounded ? `rounded-${rounded}` : '';

  const style = {
    width: width || 'auto',
    height: height || 'auto',
    ...props.style,
  };

  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${shimmerClass} ${roundedClass} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content..."
      {...props}
    />
  );
};

// Hero Section Skeleton
export const HeroSkeleton = ({ className = '' }) => (
  <div className={`relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden ${className}`}>
    <SkeletonBase className="absolute inset-0" />
    
    {/* Content overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="max-w-4xl px-6 text-center space-y-6">
        {/* Title skeleton */}
        <div className="space-y-4">
          <SkeletonBase height="60px" className="mx-auto max-w-2xl" rounded="lg" />
          <SkeletonBase height="40px" className="mx-auto max-w-xl" rounded="lg" />
        </div>
        
        {/* Subtitle skeleton */}
        <div className="space-y-2">
          <SkeletonBase height="24px" className="mx-auto max-w-lg" rounded="md" />
          <SkeletonBase height="24px" className="mx-auto max-w-md" rounded="md" />
        </div>
        
        {/* CTA button skeleton */}
        <SkeletonBase width="200px" height="50px" className="mx-auto" rounded="2xl" />
      </div>
    </div>

    {/* Carousel indicators */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
      {[...Array(3)].map((_, index) => (
        <SkeletonBase
          key={index}
          width="12px"
          height="12px"
          className="opacity-70"
          rounded
        />
      ))}
    </div>
  </div>
);

// Statistics Card Skeleton
export const StatsSkeleton = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {[...Array(count)].map((_, index) => (
      <div 
        key={index}
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Icon */}
        <div className="flex items-center justify-between">
          <SkeletonBase width="48px" height="48px" rounded="lg" />
          <SkeletonBase width="20px" height="20px" rounded />
        </div>
        
        {/* Counter */}
        <div className="space-y-2">
          <SkeletonBase height="40px" width="80%" rounded="md" />
          <SkeletonBase height="20px" width="60%" rounded="sm" />
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <SkeletonBase height="16px" width="40%" rounded="sm" />
            <SkeletonBase height="16px" width="30%" rounded="sm" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <SkeletonBase 
              className="h-2 rounded-full animate-pulse-width" 
              style={{ width: `${50 + (index * 10)}%` }}
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Feature Card Skeleton
export const FeatureCardSkeleton = ({ count = 6, columns = 3, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[3]} gap-6 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div 
          key={index}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 min-h-[300px] space-y-4"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg">
            <SkeletonBase width="24px" height="24px" />
          </div>
          
          {/* Title */}
          <SkeletonBase height="24px" width="80%" rounded="md" />
          
          {/* Description */}
          <div className="space-y-2 flex-grow">
            <SkeletonBase height="16px" width="100%" rounded="sm" />
            <SkeletonBase height="16px" width="90%" rounded="sm" />
            <SkeletonBase height="16px" width="75%" rounded="sm" />
            <SkeletonBase height="16px" width="60%" rounded="sm" />
          </div>
          
          {/* Action link */}
          <div className="flex items-center justify-between mt-4">
            <SkeletonBase height="20px" width="80px" rounded="sm" />
            <SkeletonBase width="16px" height="16px" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Testimonial Skeleton
export const TestimonialSkeleton = ({ className = '' }) => (
  <div className={`w-full h-96 md:h-[500px] bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl overflow-hidden flex items-center justify-center ${className}`}>
    <div className="max-w-4xl mx-auto text-center px-6 space-y-8">
      {/* Stars */}
      <div className="flex justify-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <SkeletonBase 
            key={index}
            width="20px" 
            height="20px" 
            className="opacity-70"
          />
        ))}
      </div>
      
      {/* Quote */}
      <div className="space-y-3">
        <SkeletonBase height="32px" width="90%" className="mx-auto" rounded="lg" />
        <SkeletonBase height="32px" width="80%" className="mx-auto" rounded="lg" />
        <SkeletonBase height="32px" width="70%" className="mx-auto" rounded="lg" />
      </div>
      
      {/* Author */}
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar */}
        <SkeletonBase width="64px" height="64px" rounded className="border-4 border-white" />
        
        {/* Name and title */}
        <div className="space-y-2">
          <SkeletonBase height="20px" width="150px" className="mx-auto" rounded="sm" />
          <SkeletonBase height="16px" width="120px" className="mx-auto" rounded="sm" />
          <SkeletonBase height="14px" width="100px" className="mx-auto" rounded="sm" />
        </div>
      </div>
    </div>

    {/* Navigation dots */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
      {[...Array(3)].map((_, index) => (
        <SkeletonBase
          key={index}
          width="12px"
          height="12px"
          className="opacity-60"
          rounded
        />
      ))}
    </div>
  </div>
);

// Navigation Bar Skeleton
export const NavSkeleton = ({ className = '' }) => (
  <div className={`w-full h-16 bg-white border-b border-gray-200 px-4 ${className}`}>
    <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
      {/* Logo */}
      <SkeletonBase width="120px" height="32px" rounded="md" />
      
      {/* Navigation items */}
      <div className="hidden md:flex items-center space-x-8">
        {[...Array(4)].map((_, index) => (
          <SkeletonBase 
            key={index}
            width="60px" 
            height="20px" 
            rounded="sm"
          />
        ))}
      </div>
      
      {/* CTA button */}
      <SkeletonBase width="100px" height="36px" rounded="lg" />
    </div>
  </div>
);

// Footer Skeleton
export const FooterSkeleton = ({ className = '' }) => (
  <div className={`w-full bg-gray-800 text-white py-12 px-4 ${className}`}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {/* Column title */}
            <SkeletonBase height="20px" width="80%" className="bg-gray-600" rounded="sm" />
            
            {/* Links */}
            <div className="space-y-2">
              {[...Array(4)].map((_, linkIndex) => (
                <SkeletonBase 
                  key={linkIndex}
                  height="16px" 
                  width={`${60 + (linkIndex * 10)}%`} 
                  className="bg-gray-700"
                  rounded="sm"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom section */}
      <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <SkeletonBase height="16px" width="200px" className="bg-gray-600" rounded="sm" />
        <div className="flex space-x-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonBase 
              key={index}
              width="24px" 
              height="24px" 
              className="bg-gray-600"
              rounded
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Complete Homepage Skeleton
export const HomePageSkeleton = ({ className = '' }) => (
  <div className={`min-h-screen bg-gray-50 ${className}`}>
    {/* Navigation */}
    <NavSkeleton />
    
    {/* Hero Section */}
    <section className="container mx-auto px-4 py-12">
      <HeroSkeleton />
    </section>
    
    {/* Statistics Section */}
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12 space-y-4">
        <SkeletonBase height="40px" width="300px" className="mx-auto" rounded="lg" />
        <SkeletonBase height="20px" width="400px" className="mx-auto" rounded="md" />
      </div>
      <StatsSkeleton />
    </section>
    
    {/* Features Section */}
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12 space-y-4">
        <SkeletonBase height="40px" width="250px" className="mx-auto" rounded="lg" />
        <SkeletonBase height="20px" width="350px" className="mx-auto" rounded="md" />
      </div>
      <FeatureCardSkeleton />
    </section>
    
    {/* Testimonials Section */}
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12 space-y-4">
        <SkeletonBase height="40px" width="280px" className="mx-auto" rounded="lg" />
        <SkeletonBase height="20px" width="380px" className="mx-auto" rounded="md" />
      </div>
      <TestimonialSkeleton />
    </section>
    
    {/* Footer */}
    <FooterSkeleton />
  </div>
);

// Text skeleton for inline content
export const TextSkeleton = ({ 
  lines = 3, 
  width = '100%', 
  height = '1rem',
  className = '',
  lastLineWidth = '75%'
}) => (
  <div className={`space-y-2 ${className}`}>
    {[...Array(lines)].map((_, index) => (
      <SkeletonBase 
        key={index}
        height={height}
        width={index === lines - 1 ? lastLineWidth : width}
        rounded="sm"
      />
    ))}
  </div>
);

// Pulse skeleton for simple loading states
export const PulseSkeleton = ({ 
  width = '100%', 
  height = '40px',
  className = '',
  ...props 
}) => (
  <div
    className={`bg-gray-200 animate-pulse ${className}`}
    style={{ width, height }}
    role="status"
    aria-label="Loading..."
    {...props}
  />
);

// Image skeleton with aspect ratio support
export const ImageSkeleton = ({ 
  aspectRatio = '16/9',
  className = '',
  rounded = 'lg',
  ...props 
}) => {
  const aspectClasses = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '21/9': 'aspect-[21/9]',
  };

  return (
    <SkeletonBase 
      className={`w-full ${aspectClasses[aspectRatio] || 'aspect-video'} ${className}`}
      rounded={rounded}
      {...props}
    />
  );
};

// List skeleton for repeated items
export const ListSkeleton = ({ 
  items = 5, 
  itemHeight = '60px',
  showAvatar = false,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {[...Array(items)].map((_, index) => (
      <div 
        key={index}
        className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {showAvatar && (
          <SkeletonBase width="40px" height="40px" rounded />
        )}
        <div className="flex-1 space-y-2">
          <SkeletonBase height="20px" width="60%" rounded="sm" />
          <SkeletonBase height="16px" width="40%" rounded="sm" />
        </div>
        <SkeletonBase width="60px" height="24px" rounded="md" />
      </div>
    ))}
  </div>
);

export default SkeletonBase;