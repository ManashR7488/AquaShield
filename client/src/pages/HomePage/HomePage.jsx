import React, { useState, useEffect } from 'react';
import {
  FiShield,
  FiHeart,
  FiUsers,
  FiBarChart2,
  FiMapPin,
  FiAlertTriangle,
  FiDroplet,
  FiActivity,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
  FiPlay,
  FiAward,
  FiGlobe,
  FiClock,
  FiTarget,
  FiEye,
  FiPhoneCall,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Foother';

// Import new components
import HeroSection from '../../components/HomePage/HeroSection';
import InteractiveFeatureCard from '../../components/HomePage/InteractiveFeatureCard';
import TestimonialCarousel from '../../components/HomePage/TestimonialCarousel';
import LoadingSkeleton from '../../components/HomePage/LoadingSkeleton';

// Import hooks and services
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import homePageService  from '../../services/homePageService';
import  useAuthStore from '../../store/useAuthStore';

// Import CSS
import '../../styles/homepage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [homePageData, setHomePageData] = useState(null);
  const [error, setError] = useState(null);

  // Intersection observer for scroll animations
  const { elementRef: featuresRef, isIntersecting: isFeaturesVisible } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const { elementRef: benefitsRef, isIntersecting: isBenefitsVisible } = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });

  // Load homepage data
  useEffect(() => {
    const loadHomePageData = async () => {
      try {
        setIsLoading(true);
        const data = await homePageService.getHomePageData();
        setHomePageData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        setError('Failed to load page data');
        setHomePageData(getStaticHomePageData());
      } finally {
        setIsLoading(false);
      }
    };
    loadHomePageData();
  }, []);

  // Navigation handlers
  const handleAuthAction = (action) => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate(`app/auth/${action}`);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Fallback static data
  const getStaticHomePageData = () => ({
    stats: {
      healthWorkers: 2847,
      communitiesCovered: 1923,
      healthReports: 15643,
      waterTestsConducted: 8756
    }
  });

  // Hero carousel slides (used for the mockup screen)
  const heroSlides = [
    {
      id: 1,
      title: "Health Surveillance",
      image: "/images/hero-slide-1.jpg",
      gradient: "from-blue-200 to-teal-200"
    },
    {
      id: 2,
      title: "Disease Maps",
      image: "/images/hero-slide-2.jpg",
      gradient: "from-purple-200 to-indigo-200"
    },
    {
      id: 3,
      title: "Water Reports",
      image: "/images/hero-slide-3.jpg",
      gradient: "from-teal-200 to-emerald-200"
    }
  ];

  const features = [
    {
      id: 1,
      icon: FiHeart,
      title: "Health Monitoring",
      description: "Comprehensive patient data collection and symptom tracking for early disease detection.",
      color: "bg-red-50 text-red-600",
      hoverColor: "hover:bg-red-100",
      link: "/features/health-monitoring",
      metrics: { improvement: "78%", label: "Detection Rate" }
    },
    {
      id: 2,
      icon: FiDroplet,
      title: "Water Quality",
      description: "Systematic water assessment and contamination detection mapping.",
      color: "bg-blue-50 text-blue-600",
      hoverColor: "hover:bg-blue-100",
      link: "/features/water-quality",
      metrics: { improvement: "92%", label: "Safety Compliance" }
    },
    {
      id: 3,
      icon: FiUsers,
      title: "Community Management",
      description: "Population health tracking and vaccination program coordination.",
      color: "bg-green-50 text-green-600",
      hoverColor: "hover:bg-green-100",
      link: "/features/community",
      metrics: { improvement: "85%", label: "Coverage Rate" }
    },
    {
      id: 4,
      icon: FiBarChart2,
      title: "Data Analytics",
      description: "Advanced analytics and predictive modeling for informed decisions.",
      color: "bg-purple-50 text-purple-600",
      hoverColor: "hover:bg-purple-100",
      link: "/features/analytics",
      metrics: { improvement: "67%", label: "Decision Speed" }
    },
    {
      id: 5,
      icon: FiAlertTriangle,
      title: "Emergency Response",
      description: "Rapid alert systems and crisis management coordination tools.",
      color: "bg-yellow-50 text-yellow-600",
      hoverColor: "hover:bg-yellow-100",
      link: "/features/emergency",
      metrics: { improvement: "45%", label: "Response Time" }
    },
    {
      id: 6,
      icon: FiMapPin,
      title: "Geographic Mapping",
      description: "GIS-based health mapping and disease outbreak visualization.",
      color: "bg-indigo-50 text-indigo-600",
      hoverColor: "hover:bg-indigo-100",
      link: "/features/mapping",
      metrics: { improvement: "90%", label: "Accuracy" }
    }
  ];

  const benefits = [
    {
      icon: FiTrendingUp,
      title: "Improved Health Outcomes",
      description: "Early detection leads to better community health.",
      stat: "78%",
      statLabel: "Faster Response"
    },
    {
      icon: FiShield,
      title: "Disease Prevention",
      description: "Proactive surveillance prevents localized outbreaks.",
      stat: "65%",
      statLabel: "Less Disease"
    },
    {
      icon: FiActivity,
      title: "Resource Allocation",
      description: "Data-driven decisions optimize healthcare resources.",
      stat: "45%",
      statLabel: "More Efficient"
    },
    {
      icon: FiTarget,
      title: "Targeted Interventions",
      description: "Precise identification of high-risk populations.",
      stat: "90%",
      statLabel: "Accuracy"
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      role: "District Health Officer",
      content: "AquaShield has revolutionized our health surveillance. We can now detect and respond to threats faster than ever.",
      rating: 5,
      avatar: "/images/testimonial-1.jpg",
      organization: "Assam Health Dept"
    },
    {
      id: 2,
      name: "Ravi Kumar",
      role: "Community Health Worker",
      content: "The platform is intuitive and helps me manage my area effectively. Offline capability is a lifesaver.",
      rating: 5,
      avatar: "/images/testimonial-2.jpg",
      organization: "Manipur Rural Mission"
    },
    {
      id: 3,
      name: "Dr. Anjali Das",
      role: "Public Health Specialist",
      content: "The analytics provide incredible insights. It's become an essential tool for our strategic planning.",
      rating: 5,
      avatar: "/images/testimonial-3.jpg",
      organization: "Meghalaya Health"
    }
  ];

  // Loading state
  if (isLoading) return <LoadingSkeleton />;

  // Error state
  if (error && !homePageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center glass-card p-12 rounded-2xl max-w-md mx-auto">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <FiAlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get stats data
  const statsData = homePageData?.stats || getStaticHomePageData().stats;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans text-gray-900">
      {/* Enhanced Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="bg-blue-600/10 p-2 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                <FiShield className="text-blue-600 animate-float" size={28} />
              </div>
              <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-600">
                AquaShield
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'Features', 'About', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                  className="nav-item text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-2"
                >
                  {item}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600 hidden lg:block">Hi, {user?.name}</span>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary px-6 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-blue-500/20"
                  >
                    Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 px-4 py-2 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthAction('signup')}
                    className="btn-primary px-6 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-blue-500/20"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/20 animate-fade-in-down absolute w-full">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {['Home', 'Features', 'About', 'Contact'].map((item) => (
                <Link
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col space-y-3">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full btn-primary py-3 rounded-xl font-medium"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthAction('login')}
                      className="w-full py-3 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleAuthAction('signup')}
                      className="w-full btn-primary py-3 rounded-xl font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section - Replaced Carousel */}
        <HeroSection 
          slides={heroSlides} 
          statsData={statsData}
          onPrimaryAction={() => handleAuthAction('signup')}
          onSecondaryAction={() => {}}
        />

        {/* Features Section */}
        <section ref={featuresRef} className="pt-20 pb-24 bg-gradient-to-b from-slate-50 to-white relative">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
              <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase mb-4 block">Our Platform Capabilities</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Comprehensive <span className="text-gradient">Health Surveillance</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Empowering health workers with cutting-edge digital tools for real-time monitoring, 
                rapid response, and data-driven decision making.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.id}
                  className="stagger-children h-full"
                  style={{ '--index': index, '--stagger-delay': '100ms' }}
                >
                  <InteractiveFeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    color={feature.color}
                    hoverColor={feature.hoverColor}
                    link={feature.link}
                    metrics={feature.metrics}
                    variant="glass"
                    className="h-full"
                    onClick={() => navigate(feature.link)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits / Impact Section - Bento Grid Style */}
        <section ref={benefitsRef} className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Text Content */}
              <div className="lg:col-span-5 mb-10 lg:mb-0">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Proven Impact on <br/><span className="text-blue-600">Community Health</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our platform has demonstrated measurable improvements across Northeast India. 
                  Through data-driven surveillance, we've reduced response times and improved health outcomes.
                </p>
                
                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <benefit.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                        <p className="text-sm text-gray-500">{benefit.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">{benefit.stat}</div>
                        <div className="text-xs text-gray-400">{benefit.statLabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Content - Grid */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-4 h-[600px]">
                 <div className="glass-card rounded-2xl p-6 col-span-2 row-span-1 flex items-center justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Real-time Visualization</h3>
                      <p className="text-gray-500 max-w-sm">Live mapping of disease outbreaks and resource allocation.</p>
                    </div>
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FiMapPin size={40} className="text-blue-500" />
                    </div>
                 </div>
                 
                 <div className="glass-card rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-gradient-to-br hover:from-blue-50 hover:to-transparent transition-colors">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 text-teal-600 group-hover:rotate-12 transition-transform">
                      <FiActivity size={32} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">AI Analytics</h4>
                    <p className="text-sm text-gray-500 mt-2">Predictive modeling for outbreak prevention</p>
                 </div>

                 <div className="glass-card rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-gradient-to-br hover:from-purple-50 hover:to-transparent transition-colors">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-600 group-hover:-rotate-12 transition-transform">
                      <FiCheckCircle size={32} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">Verified Data</h4>
                    <p className="text-sm text-gray-500 mt-2">Blockchain-backed data integrity</p>
                 </div>

                 <div className="glass-card rounded-2xl p-8 col-span-2 flex items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10 w-full">
                       <div className="flex justify-between items-end">
                          <div>
                             <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">System Uptime</div>
                             <div className="text-5xl font-bold text-gray-900">99.9%</div>
                          </div>
                          <div className="h-16 flex items-end space-x-1">
                              {[40, 70, 45, 90, 65, 85, 95].map((h, i) => (
                                  <div key={i} className="w-3 bg-blue-500 rounded-t-sm animate-pulse-width" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} />
                              ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Clean & Modern */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Professionals</h2>
              <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full" />
            </div>
            <TestimonialCarousel
              testimonials={testimonials}
              autoPlay={true}
              interval={5000}
              showDots={true}
              className="w-full max-w-5xl mx-auto"
            />
          </div>
        </section>

        {/* CTA Section - High Impact */}
        <section className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 bg-blue-900">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800" />
             <div className="absolute inset-0 bg-[url('/images/pattern-grid.png')] opacity-10" />
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/30" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
              Ready to transform healthcare?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Join our network of professionals using AquaShield to build a safer, healthier future for everyone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-400">
               <button
                 onClick={() => handleAuthAction('signup')}
                 className="btn-hover-lift bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl flex items-center"
               >
                 Get Started Now
                 <FiArrowRight className="ml-2" />
               </button>
               <Link
                 to="/contact"
                 className="px-8 py-4 rounded-xl font-semibold text-lg text-white border border-white/30 hover:bg-white/10 transition-all flex items-center backdrop-blur-sm"
               >
                 <FiPhoneCall className="mr-2" />
                 Contact Sales
               </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default HomePage;
