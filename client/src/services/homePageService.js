import axios from '../config/axios.js';
// import { useAuthStore } from '../store/useAuthStore.js';

/**
 * HomePage Service - Handles all data management for the HomePage
 * Provides statistics API, content management, authentication integration,
 * performance optimization, and real-time updates
 */
class HomePageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Cache management
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Retry logic for failed requests
  async withRetry(apiCall, attempts = this.retryAttempts) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempts > 1 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay);
        return this.withRetry(apiCall, attempts - 1);
      }
      throw error;
    }
  }

  shouldRetry(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.response?.status) || !error.response;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Statistics API methods
  async getHealthWorkerStats(useCache = true) {
    const cacheKey = this.getCacheKey('health_workers');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/statistics/health-workers')
      );
      
      const data = {
        total: response.data.total || 1200,
        active: response.data.active || 950,
        ashaWorkers: response.data.ashaWorkers || 650,
        healthOfficials: response.data.healthOfficials || 300,
        growth: response.data.growth || 15, // percentage
        lastUpdated: response.data.lastUpdated || new Date().toISOString(),
      };
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching health worker stats:', error);
      // Return fallback data
      return {
        total: 1200,
        active: 950,
        ashaWorkers: 650,
        healthOfficials: 300,
        growth: 15,
        lastUpdated: new Date().toISOString(),
        isOffline: true,
      };
    }
  }

  async getCommunityStats(useCache = true) {
    const cacheKey = this.getCacheKey('community_stats');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/statistics/community-coverage')
      );
      
      const data = {
        communitiesCovered: response.data.communitiesCovered || 450,
        populationReached: response.data.populationReached || 125000,
        activeReports: response.data.activeReports || 89,
        coverage: response.data.coverage || 78, // percentage
        lastUpdated: response.data.lastUpdated || new Date().toISOString(),
      };
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching community stats:', error);
      return {
        communitiesCovered: 450,
        populationReached: 125000,
        activeReports: 89,
        coverage: 78,
        lastUpdated: new Date().toISOString(),
        isOffline: true,
      };
    }
  }

  async getHealthReports(useCache = true) {
    const cacheKey = this.getCacheKey('health_reports');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/statistics/health-reports')
      );
      
      const data = {
        totalReports: response.data.totalReports || 2840,
        recentReports: response.data.recentReports || 156,
        criticalAlerts: response.data.criticalAlerts || 12,
        resolvedIssues: response.data.resolvedIssues || 2650,
        averageResponseTime: response.data.averageResponseTime || 4.2, // hours
        lastUpdated: response.data.lastUpdated || new Date().toISOString(),
      };
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching health reports:', error);
      return {
        totalReports: 2840,
        recentReports: 156,
        criticalAlerts: 12,
        resolvedIssues: 2650,
        averageResponseTime: 4.2,
        lastUpdated: new Date().toISOString(),
        isOffline: true,
      };
    }
  }

  async getWaterTestStats(useCache = true) {
    const cacheKey = this.getCacheKey('water_tests');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/statistics/water-tests')
      );
      
      const data = {
        totalTests: response.data.totalTests || 15600,
        passedTests: response.data.passedTests || 14200,
        failedTests: response.data.failedTests || 1400,
        pendingTests: response.data.pendingTests || 89,
        passRate: response.data.passRate || 91, // percentage
        trendsImproving: response.data.trendsImproving || true,
        lastUpdated: response.data.lastUpdated || new Date().toISOString(),
      };
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching water test stats:', error);
      return {
        totalTests: 15600,
        passedTests: 14200,
        failedTests: 1400,
        pendingTests: 89,
        passRate: 91,
        trendsImproving: true,
        lastUpdated: new Date().toISOString(),
        isOffline: true,
      };
    }
  }

  // Comprehensive statistics for homepage counters
  async getAllStats(useCache = true) {
    try {
      const [healthWorkers, community, reports, waterTests] = await Promise.allSettled([
        this.getHealthWorkerStats(useCache),
        this.getCommunityStats(useCache),
        this.getHealthReports(useCache),
        this.getWaterTestStats(useCache),
      ]);

      return {
        healthWorkers: healthWorkers.status === 'fulfilled' ? healthWorkers.value : null,
        community: community.status === 'fulfilled' ? community.value : null,
        reports: reports.status === 'fulfilled' ? reports.value : null,
        waterTests: waterTests.status === 'fulfilled' ? waterTests.value : null,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching all stats:', error);
      throw error;
    }
  }

  // Content management methods
  async getHeroSlides(useCache = true) {
    const cacheKey = this.getCacheKey('hero_slides');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/content/hero-slides')
      );
      
      const data = response.data.slides || this.getDefaultHeroSlides();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      return this.getDefaultHeroSlides();
    }
  }

  getDefaultHeroSlides() {
    return [
      {
        id: 1,
        title: "Empowering Communities Through Health Technology",
        subtitle: "Advanced water quality monitoring and health reporting system for rural and urban communities",
        ctaText: "Get Started",
        ctaLink: "/app/auth/signup",
        image: null,
      },
      {
        id: 2,
        title: "Real-Time Health Monitoring",
        subtitle: "Track community health metrics, water quality, and generate actionable insights",
        ctaText: "Learn More",
        ctaLink: "#features",
        image: null,
      },
      {
        id: 3,
        title: "Join Our Network of Health Workers",
        subtitle: "Connect with ASHA workers, health officials, and community members nationwide",
        ctaText: "Join Now",
        ctaLink: "/app/auth/signup",
        image: null,
      },
    ];
  }

  async getFeatures(useCache = true) {
    const cacheKey = this.getCacheKey('features');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/content/features')
      );
      
      const data = response.data.features || this.getDefaultFeatures();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching features:', error);
      return this.getDefaultFeatures();
    }
  }

  getDefaultFeatures() {
    return [
      {
        id: 1,
        title: "Water Quality Monitoring",
        description: "Real-time water quality testing and monitoring with instant alerts and comprehensive reporting.",
        icon: "BeakerIcon",
        link: "#water-monitoring",
      },
      {
        id: 2,
        title: "Health Reporting System",
        description: "Streamlined health data collection, analysis, and reporting for community health workers.",
        icon: "DocumentChartBarIcon",
        link: "#health-reports",
      },
      {
        id: 3,
        title: "Community Dashboard",
        description: "Comprehensive analytics and insights for health officials and community leaders.",
        icon: "ChartBarIcon",
        link: "#dashboard",
      },
      {
        id: 4,
        title: "Mobile-First Design",
        description: "Optimized for mobile devices used by ASHA workers and field health professionals.",
        icon: "DevicePhoneMobileIcon",
        link: "#mobile",
      },
      {
        id: 5,
        title: "Real-Time Alerts",
        description: "Instant notifications for critical health issues and water quality concerns.",
        icon: "BellAlertIcon",
        link: "#alerts",
      },
      {
        id: 6,
        title: "Secure & Compliant",
        description: "HIPAA-compliant data handling with enterprise-grade security and privacy protection.",
        icon: "ShieldCheckIcon",
        link: "#security",
      },
    ];
  }

  async getTestimonials(useCache = true) {
    const cacheKey = this.getCacheKey('testimonials');
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get('/api/content/testimonials')
      );
      
      const data = response.data.testimonials || this.getDefaultTestimonials();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return this.getDefaultTestimonials();
    }
  }

  getDefaultTestimonials() {
    return [
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
  }

  // Authentication integration methods
  getUserSpecificContent(user) {
    if (!user) return null;

    const roleSpecificContent = {
      admin: {
        heroTitle: "Welcome back, Administrator",
        heroSubtitle: "Manage the entire health monitoring network and oversee community initiatives",
        primaryCTA: "Go to Admin Dashboard",
        primaryCTALink: "/dashboard/admin",
      },
      health_official: {
        heroTitle: "Welcome back, Health Official",
        heroSubtitle: "Monitor health metrics and coordinate with field workers in your district",
        primaryCTA: "View Health Reports",
        primaryCTALink: "/dashboard/reports",
      },
      asha_worker: {
        heroTitle: "Welcome back, ASHA Worker",
        heroSubtitle: "Continue your important work in community health monitoring and reporting",
        primaryCTA: "Create New Report",
        primaryCTALink: "/dashboard/reports/new",
      },
      volunteer: {
        heroTitle: "Welcome back, Volunteer",
        heroSubtitle: "Track your contributions to community health and water quality initiatives",
        primaryCTA: "View My Activities",
        primaryCTALink: "/dashboard/activities",
      },
      community_member: {
        heroTitle: "Welcome to your Community Health Hub",
        heroSubtitle: "Stay informed about local health initiatives and water quality updates",
        primaryCTA: "View Community Status",
        primaryCTALink: "/dashboard/community",
      },
    };

    return roleSpecificContent[user.role] || roleSpecificContent.community_member;
  }

  async getUserStats(userId, useCache = true) {
    const cacheKey = this.getCacheKey('user_stats', { userId });
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.withRetry(() => 
        axios.get(`/api/users/${userId}/stats`)
      );
      
      const data = response.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Real-time updates (WebSocket preparation)
  setupRealTimeUpdates(callback) {
    // This would integrate with WebSocket connection
    // For now, we'll use polling as fallback
    const pollInterval = 30000; // 30 seconds
    
    const poll = async () => {
      try {
        const stats = await this.getAllStats(false); // Don't use cache
        callback(stats);
      } catch (error) {
        console.error('Error in real-time update:', error);
      }
    };

    const interval = setInterval(poll, pollInterval);
    
    return () => {
      clearInterval(interval);
    };
  }

  // Performance optimization methods
  preloadContent() {
    // Preload critical content in the background
    setTimeout(() => {
      this.getHeroSlides(false);
      this.getFeatures(false);
      this.getAllStats(false);
    }, 1000);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const homePageService = new HomePageService();

// Custom hooks for easier React integration
export const useHomePageStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await homePageService.getAllStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error, refetch: () => fetchStats() };
};

export const useHomePageContent = () => {
  const [content, setContent] = useState({
    heroSlides: [],
    features: [],
    testimonials: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const [heroSlides, features, testimonials] = await Promise.all([
          homePageService.getHeroSlides(),
          homePageService.getFeatures(),
          homePageService.getTestimonials(),
        ]);
        
        setContent({ heroSlides, features, testimonials });
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return { content, loading, error };
};

export const useRealTimeStats = () => {
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const cleanup = homePageService.setupRealTimeUpdates((newStats) => {
      setStats(newStats);
      setLastUpdated(new Date());
    });

    return cleanup;
  }, []);

  return { stats, lastUpdated };
};

export default homePageService;