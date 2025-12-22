import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import HeroCarousel from '../../components/HomePage/HeroCarousel';
import AnimatedCounter from '../../components/HomePage/AnimatedCounter';
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
  const { elementRef: heroRef, isIntersecting: isHeroVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });
  
  const { elementRef: statsRef, isIntersecting: isStatsVisible } = useIntersectionObserver({
    threshold: 0.3,
    triggerOnce: true
  });
  
  const { elementRef: featuresRef, isIntersecting: isFeaturesVisible } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true
  });

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
        // Fallback to static data
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fallback static data
  const getStaticHomePageData = () => ({
    stats: {
      healthWorkers: 2847,
      communitiesCovered: 1923,
      healthReports: 15643,
      waterTestsConducted: 8756
    }
  });

  // Hero carousel slides
  const heroSlides = [
    {
      id: 1,
      title: "Empowering Health Surveillance Across Northeast India",
      subtitle: "Advanced digital platform for comprehensive community health monitoring and water quality surveillance",
      image: "/images/hero-slide-1.jpg",
      cta: {
        primary: { text: "Start Monitoring", action: () => handleAuthAction('signup') },
        secondary: { text: "Watch Demo", action: () => {} }
      },
      gradient: "from-blue-900 via-blue-800 to-teal-700"
    },
    {
      id: 2,
      title: "Real-time Disease Detection & Prevention",
      subtitle: "Early warning systems and rapid response protocols to protect communities from health threats",
      image: "/images/hero-slide-2.jpg",
      cta: {
        primary: { text: "Get Started", action: () => handleAuthAction('signup') },
        secondary: { text: "Learn More", action: () => {} }
      },
      gradient: "from-purple-900 via-blue-800 to-indigo-700"
    },
    {
      id: 3,
      title: "Water Quality Assurance for Safer Communities",
      subtitle: "Systematic water testing and contamination monitoring to ensure safe drinking water access",
      image: "/images/hero-slide-3.jpg",
      cta: {
        primary: { text: "View Reports", action: () => navigate('/reports') },
        secondary: { text: "Contact Us", action: () => {} }
      },
      gradient: "from-teal-900 via-cyan-800 to-blue-700"
    }
  ];

  const features = [
    {
      id: 1,
      icon: FiHeart,
      title: "Health Monitoring",
      description: "Comprehensive patient data collection, symptom tracking, and health status monitoring for early disease detection.",
      color: "bg-red-100 text-red-600",
      hoverColor: "hover:bg-red-200",
      link: "/features/health-monitoring",
      metrics: { improvement: "78%", label: "Detection Rate" }
    },
    {
      id: 2,
      icon: FiDroplet,
      title: "Water Quality Testing",
      description: "Systematic water quality assessment, contamination detection, and safe water source mapping.",
      color: "bg-blue-100 text-blue-600",
      hoverColor: "hover:bg-blue-200",
      link: "/features/water-quality",
      metrics: { improvement: "92%", label: "Safety Compliance" }
    },
    {
      id: 3,
      icon: FiUsers,
      title: "Community Management",
      description: "Population health tracking, vaccination programs, and community outreach coordination.",
      color: "bg-green-100 text-green-600",
      hoverColor: "hover:bg-green-200",
      link: "/features/community",
      metrics: { improvement: "85%", label: "Coverage Rate" }
    },
    {
      id: 4,
      icon: FiBarChart2,
      title: "Data Analytics",
      description: "Advanced analytics, trend analysis, and predictive modeling for informed health decisions.",
      color: "bg-purple-100 text-purple-600",
      hoverColor: "hover:bg-purple-200",
      link: "/features/analytics",
      metrics: { improvement: "67%", label: "Decision Speed" }
    },
    {
      id: 5,
      icon: FiAlertTriangle,
      title: "Emergency Response",
      description: "Rapid alert systems, emergency reporting, and crisis management coordination.",
      color: "bg-yellow-100 text-yellow-600",
      hoverColor: "hover:bg-yellow-200",
      link: "/features/emergency",
      metrics: { improvement: "45%", label: "Response Time" }
    },
    {
      id: 6,
      icon: FiMapPin,
      title: "Geographic Mapping",
      description: "GIS-based health mapping, disease outbreak visualization, and resource allocation planning.",
      color: "bg-indigo-100 text-indigo-600",
      hoverColor: "hover:bg-indigo-200",
      link: "/features/mapping",
      metrics: { improvement: "90%", label: "Accuracy" }
    }
  ];

  const benefits = [
    {
      icon: FiTrendingUp,
      title: "Improved Health Outcomes",
      description: "Early detection and prevention lead to better community health",
      stat: "78% improvement in response time"
    },
    {
      icon: FiShield,
      title: "Enhanced Disease Prevention",
      description: "Proactive surveillance prevents disease outbreaks",
      stat: "65% reduction in preventable diseases"
    },
    {
      icon: FiActivity,
      title: "Efficient Resource Allocation",
      description: "Data-driven decisions optimize healthcare resources",
      stat: "45% increase in efficiency"
    },
    {
      icon: FiTarget,
      title: "Targeted Interventions",
      description: "Precise identification of high-risk areas and populations",
      stat: "90% accuracy in risk assessment"
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      role: "District Health Officer, Guwahati",
      content: "AquaShield has revolutionized our health surveillance capabilities. We can now detect and respond to health threats much faster than before.",
      rating: 5,
      avatar: "/images/testimonial-1.jpg",
      organization: "Assam Health Department"
    },
    {
      id: 2,
      name: "Ravi Kumar",
      role: "Community Health Worker, Imphal",
      content: "The platform is intuitive and helps me manage my assigned areas effectively. The offline capability is particularly useful in remote areas.",
      rating: 5,
      avatar: "/images/testimonial-2.jpg",
      organization: "Manipur Rural Health Mission"
    },
    {
      id: 3,
      name: "Dr. Anjali Das",
      role: "Public Health Specialist, Shillong",
      content: "The analytics and reporting features provide incredible insights into health trends. It's become an essential tool for our decision-making.",
      rating: 5,
      avatar: "/images/testimonial-3.jpg",
      organization: "Meghalaya Health Services"
    },
    {
      id: 4,
      name: "Dr. Rajesh Thapa",
      role: "Medical Officer, Gangtok",
      content: "The real-time monitoring and alert systems have significantly improved our emergency response capabilities in remote mountainous regions.",
      rating: 5,
      avatar: "/images/testimonial-4.jpg",
      organization: "Sikkim Health Department"
    },
    {
      id: 5,
      name: "Sunita Devi",
      role: "ASHA Worker, Aizawl",
      content: "Easy to use interface makes my daily reporting tasks much simpler. The mobile app works perfectly even in areas with poor connectivity.",
      rating: 5,
      avatar: "/images/testimonial-5.jpg",
      organization: "Mizoram Health Ministry"
    }
  ];

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error && !homePageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <FiShield className="text-blue-600 mr-3 animate-float" size={32} />
              <span className="text-gray-900 font-bold text-xl">AquaShield</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="nav-item text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link to="/features" className="nav-item text-gray-700 hover:text-blue-600 font-medium">
                Features
              </Link>
              <Link to="/about" className="nav-item text-gray-700 hover:text-blue-600 font-medium">
                About
              </Link>
              <Link to="/contact" className="nav-item text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user?.name}</span>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-hover-lift bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                  >
                    Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthAction('signup')}
                    className="btn-hover-lift bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link to="/features" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Features
              </Link>
              <Link to="/about" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                About
              </Link>
              <Link to="/contact" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Contact
              </Link>
              <div className="pt-2 border-t border-gray-200">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="block w-full text-left px-3 py-2 text-blue-600 font-medium"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthAction('login')}
                      className="block w-full text-left px-3 py-2 text-gray-700"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleAuthAction('signup')}
                      className="block w-full text-left px-3 py-2 text-blue-600 font-medium"
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

      {/* Enhanced Hero Section with Carousel */}
      <section ref={heroRef} className="relative pt-16 overflow-hidden min-h-screen flex items-center">
        <HeroCarousel 
          slides={heroSlides}
          autoPlay={true}
          interval={5000}
          showDots={true}
          showArrows={true}
          className="w-full"
        />
        
        {/* Floating Stats Cards */}
        <div 
          ref={statsRef}
          className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 ${
            isStatsVisible ? 'animate-slide-in-bottom' : 'opacity-0'
          }`}
        >
          <div className="glass-strong rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <AnimatedCounter
                  end={statsData.healthWorkers}
                  duration={2000}
                  className="text-2xl md:text-3xl font-bold text-white mb-2"
                  isVisible={isStatsVisible}
                />
                <div className="text-gray-200 text-sm font-medium">Health Workers</div>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  end={statsData.communitiesCovered}
                  duration={2000}
                  delay={200}
                  className="text-2xl md:text-3xl font-bold text-white mb-2"
                  isVisible={isStatsVisible}
                />
                <div className="text-gray-200 text-sm font-medium">Communities</div>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  end={statsData.healthReports}
                  duration={2000}
                  delay={400}
                  className="text-2xl md:text-3xl font-bold text-white mb-2"
                  isVisible={isStatsVisible}
                />
                <div className="text-gray-200 text-sm font-medium">Health Reports</div>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  end={statsData.waterTestsConducted}
                  duration={2000}
                  delay={600}
                  className="text-2xl md:text-3xl font-bold text-white mb-2"
                  isVisible={isStatsVisible}
                />
                <div className="text-gray-200 text-sm font-medium">Water Tests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section ref={featuresRef} className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive Health Surveillance Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Empowering health workers and administrators with cutting-edge tools for 
              community health monitoring, disease prevention, and water quality assurance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.id}
                className="stagger-children"
                style={{ '--index': index, '--stagger-delay': '150ms' }}
              >
                <InteractiveFeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  hoverColor={feature.hoverColor}
                  link={feature.link}
                  metrics={feature.metrics}
                  variant="default"
                  className="h-full"
                  onClick={() => navigate(feature.link)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Proven Impact on Community Health
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform has demonstrated measurable improvements in health outcomes 
                across Northeast India through data-driven surveillance and intervention.
              </p>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 mb-2">{benefit.description}</p>
                      <p className="text-sm font-medium text-blue-600">{benefit.stat}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <FiEye className="text-blue-600 mx-auto mb-3" size={32} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Continuous Monitoring</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <FiGlobe className="text-green-600 mx-auto mb-3" size={32} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">8 States</div>
                  <div className="text-sm text-gray-600">Northeast Coverage</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <FiClock className="text-purple-600 mx-auto mb-3" size={32} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">&lt;15min</div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <FiAward className="text-yellow-600 mx-auto mb-3" size={32} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime Reliability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Health Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from the health workers and administrators making a difference with AquaShield
            </p>
          </div>
          
          <TestimonialCarousel
            testimonials={testimonials}
            autoPlay={true}
            interval={4000}
            showDots={true}
            className="w-full"
          />
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-in-up">
            Ready to Transform Community Health Surveillance?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Join thousands of health professionals already using AquaShield to protect and 
            improve community health across Northeast India.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-400">
            <button
              onClick={() => handleAuthAction('signup')}
              className="btn-hover-lift bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center justify-center shadow-2xl"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              <FiArrowRight className="ml-2" size={20} />
            </button>
            <Link
              to="/contact"
              className="btn-hover-glow border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center justify-center shadow-2xl"
            >
              <FiPhoneCall className="mr-2" size={20} />
              Contact Sales
            </Link>
          </div>

          {/* Additional Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up animation-delay-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200 text-sm">Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">8</div>
              <div className="text-blue-200 text-sm">States Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">15min</div>
              <div className="text-blue-200 text-sm">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;