import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiPlay, FiShield, FiActivity, FiCheckCircle } from 'react-icons/fi';
import AnimatedCounter from './AnimatedCounter';

const HeroSection = ({ 
  slides, 
  statsData, 
  onPrimaryAction, 
  onSecondaryAction,
  className = "" 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-cycle dashboard images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className={`relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 z-0"></div>
      
      {/* Animated Blobs */}
      <div className="absolute top-0 right-0 -mr-64 -mt-64 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-64 -mb-64 w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Content */}
          <div className="text-left animate-fade-in-up">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-blue-100 shadow-sm mb-8 animate-fade-in-down">
              <span className="flex h-2 w-2 relative mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-semibold text-blue-700 tracking-wide uppercase">Trusted by 8+ States</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Protecting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Communities
              </span> <br />
              With Data.
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              AquaShield is the advanced surveillance platform ensuring safe water and community health across Northeast India.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onPrimaryAction}
                className="btn-primary px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center group"
              >
                Start Monitoring
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={onSecondaryAction}
                className="px-8 py-4 rounded-xl text-lg font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <FiPlay className="mr-2 text-blue-500 fill-current" />
                Live Demo
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200/60 pt-8">
                <div>
                   <div className="text-2xl font-bold text-slate-900"><AnimatedCounter end={statsData.healthWorkers} />+</div>
                   <div className="text-sm text-slate-500 font-medium">Workers</div>
                </div>
                <div>
                   <div className="text-2xl font-bold text-slate-900"><AnimatedCounter end={statsData.communitiesCovered} />+</div>
                   <div className="text-sm text-slate-500 font-medium">Communities</div>
                </div>
                <div>
                   <div className="text-2xl font-bold text-slate-900"><AnimatedCounter end={statsData.waterTestsConducted} />+</div>
                   <div className="text-sm text-slate-500 font-medium">Tests Done</div>
                </div>
            </div>
          </div>

          {/* Right Column: 3D Dashboard Mockup */}
          <div className="relative perspective-2000 lg:h-[600px] flex items-center justify-center animate-fade-in-up animation-delay-200 hidden md:flex">
             {/* The Tilted Dashboard Container */}
             <div className="relative w-full aspect-[4/3] hero-dashboard-card rounded-2xl overflow-hidden glass-strong z-20 bg-white/40 border-2 border-white/60">
                 {/* Dashboard Header Mockup */}
                 <div className="h-12 bg-white/80 border-b border-white/50 flex items-center px-4 justify-between backdrop-blur-md">
                    <div className="flex space-x-2">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-6 w-1/3 bg-slate-100 rounded-full"></div>
                 </div>

                 {/* Screen Content (Carousel) */}
                 <div className="relative w-full h-[calc(100%-48px)] bg-slate-50 overflow-hidden">
                    {slides.map((slide, index) => (
                       <div 
                         key={index}
                         className={`absolute inset-0 transition-opacity duration-1000 ${
                           index === currentSlide ? 'opacity-100' : 'opacity-0'
                         }`}
                       >
                         {/* Fallback visual if no image */}
                         {slide.image ? (
                           <img src={slide.image} alt="Dashboard View" className="w-full h-full object-cover" />
                         ) : (
                           <div className={`w-full h-full bg-gradient-to-br ${slide.gradient || 'from-blue-100 to-indigo-100'}`} />
                         )}
                         
                         {/* Text overlay inside the mockup (optional) */}
                         <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                            <h3 className="text-white text-lg font-bold">{slide.title}</h3>
                         </div>
                       </div>
                    ))}
                 </div>
             </div>

             {/* Floating Elements around the Mockup */}
             <div className="absolute -left-12 top-1/4 z-30 floating-card-1">
                <div className="glass card hover:scale-105 transition-transform p-4 rounded-2xl shadow-xl bg-white/80 backdrop-blur-xl border border-white/60">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg text-green-600">
                         <FiCheckCircle size={24} />
                      </div>
                      <div>
                         <div className="text-xs text-slate-500 font-bold uppercase">System Status</div>
                         <div className="text-sm font-bold text-slate-800">Normal</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="absolute -right-8 bottom-1/4 z-30 floating-card-2">
                <div className="glass card hover:scale-105 transition-transform p-4 rounded-2xl shadow-xl bg-white/80 backdrop-blur-xl border border-white/60">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                         <FiActivity size={24} />
                      </div>
                      <div>
                         <div className="text-xs text-slate-500 font-bold uppercase">Active Alerts</div>
                         <div className="text-sm font-bold text-slate-800">0 Critical</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
