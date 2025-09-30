import React, { useState } from 'react';
import {
  FiSearch,
  FiBook,
  FiUsers,
  FiShield,
  FiHeart,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiAlertTriangle,
  FiSettings,
  FiUser,
  FiBarChart2,
  FiChevronRight,
  FiChevronDown,
  FiExternalLink,
  FiDownload,
  FiPlay
} from 'react-icons/fi';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: FiBook,
      color: 'bg-blue-100 text-blue-600',
      articles: [
        { title: 'How to create your account', views: '2.3k' },
        { title: 'Setting up your profile', views: '1.8k' },
        { title: 'Understanding your dashboard', views: '1.5k' },
        { title: 'First steps as a health worker', views: '1.2k' }
      ]
    },
    {
      id: 'health-monitoring',
      title: 'Health Monitoring',
      icon: FiHeart,
      color: 'bg-red-100 text-red-600',
      articles: [
        { title: 'Recording patient data', views: '3.1k' },
        { title: 'Water quality testing procedures', views: '2.7k' },
        { title: 'Disease surveillance protocols', views: '2.4k' },
        { title: 'Emergency reporting guidelines', views: '2.0k' }
      ]
    },
    {
      id: 'community-management',
      title: 'Community Management',
      icon: FiUsers,
      color: 'bg-green-100 text-green-600',
      articles: [
        { title: 'Managing your assigned areas', views: '1.9k' },
        { title: 'Community outreach programs', views: '1.6k' },
        { title: 'Vaccination tracking', views: '1.4k' },
        { title: 'Health education campaigns', views: '1.1k' }
      ]
    },
    {
      id: 'data-analytics',
      title: 'Data & Analytics',
      icon: FiBarChart2,
      color: 'bg-purple-100 text-purple-600',
      articles: [
        { title: 'Understanding health trends', views: '1.7k' },
        { title: 'Generating reports', views: '1.5k' },
        { title: 'Data visualization tools', views: '1.3k' },
        { title: 'Export and sharing data', views: '1.0k' }
      ]
    },
    {
      id: 'safety-security',
      title: 'Safety & Security',
      icon: FiShield,
      color: 'bg-yellow-100 text-yellow-600',
      articles: [
        { title: 'Account security best practices', views: '2.2k' },
        { title: 'Data privacy guidelines', views: '1.8k' },
        { title: 'Two-factor authentication setup', views: '1.6k' },
        { title: 'Reporting security issues', views: '0.9k' }
      ]
    },
    {
      id: 'account-settings',
      title: 'Account & Settings',
      icon: FiSettings,
      color: 'bg-gray-100 text-gray-600',
      articles: [
        { title: 'Updating your profile information', views: '2.0k' },
        { title: 'Notification preferences', views: '1.7k' },
        { title: 'Language and region settings', views: '1.2k' },
        { title: 'Deactivating your account', views: '0.8k' }
      ]
    }
  ];

  const faqItems = [
    {
      question: 'How do I report a health emergency in my area?',
      answer: 'To report a health emergency, go to your dashboard and click on the "Emergency Report" button (red button with alert icon). Fill in the required details including location, type of emergency, number of people affected, and immediate actions taken. The report will be automatically sent to district health authorities.'
    },
    {
      question: 'What should I do if I cannot access water quality testing equipment?',
      answer: 'If testing equipment is unavailable, immediately contact your supervisor through the app messaging system. Document the issue in the "Equipment Status" section and use alternative observation methods to assess water quality visually. Report any obvious contamination signs immediately.'
    },
    {
      question: 'How often should I update community health data?',
      answer: 'Regular health data should be updated weekly, vaccination records should be updated within 24 hours of administration, and disease surveillance data should be reported daily during outbreak periods. Emergency situations require immediate reporting.'
    },
    {
      question: 'Can I work offline when internet connectivity is poor?',
      answer: 'Yes, AquaShield has offline capabilities. You can record data, take photos, and fill forms while offline. Data will automatically sync when you reconnect to the internet. Look for the sync status indicator in the top bar.'
    },
    {
      question: 'How do I change my assigned coverage area?',
      answer: 'Coverage area changes must be requested through your district coordinator. Use the "Request Area Change" option in Settings > Professional Information, provide justification, and wait for approval. Changes typically take 3-5 business days to process.'
    },
    {
      question: 'What languages are supported in the application?',
      answer: 'AquaShield supports English, Hindi, Assamese, Bengali, Bodo, Manipuri, Mizo, Nagamese, and Nepali. You can change your language preference in Settings > General Preferences > Preferred Language.'
    }
  ];

  const quickActions = [
    {
      title: 'Submit Emergency Report',
      description: 'Report urgent health situations immediately',
      icon: FiAlertTriangle,
      color: 'bg-red-500',
      link: '/dashboard'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: FiMessageCircle,
      color: 'bg-blue-500',
      link: '#contact'
    },
    {
      title: 'Download User Manual',
      description: 'Complete guide in PDF format',
      icon: FiDownload,
      color: 'bg-green-500',
      link: '/assets/user-manual.pdf'
    },
    {
      title: 'Video Tutorials',
      description: 'Learn through step-by-step videos',
      icon: FiPlay,
      color: 'bg-purple-500',
      link: '#tutorials'
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions and learn how to make the most of AquaShield's 
            health surveillance platform for your community.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for help articles, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.link}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <FiExternalLink className="text-gray-400 mt-3 group-hover:text-blue-500 transition-colors" size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Help Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mr-4`}>
                        <category.icon size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {category.articles.slice(0, 3).map((article, index) => (
                        <a
                          key={index}
                          href="#"
                          className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
                        >
                          <span className="group-hover:underline">{article.title}</span>
                          <span className="text-xs text-gray-400">{article.views}</span>
                        </a>
                      ))}
                    </div>
                    <a
                      href="#"
                      className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all articles
                      <FiChevronRight className="ml-1" size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="bg-white border border-gray-200 rounded-lg">
              {faqItems.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <FiChevronDown className="text-gray-400 flex-shrink-0" size={16} />
                      ) : (
                        <FiChevronRight className="text-gray-400 flex-shrink-0" size={16} />
                      )}
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <div id="contact" className="mt-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
            <p className="text-gray-600 mb-8">
              Our support team is here to assist you. Choose the best way to reach us based on your needs.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get detailed help via email. Response within 24 hours.
                </p>
                <a
                  href="mailto:support@aquashield.gov.in"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Send Email
                </a>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPhone className="text-green-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Speak directly with our team. Available 9 AM - 6 PM IST.
                </p>
                <a
                  href="tel:+911800123456"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Call Now
                </a>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Chat with our support agents for immediate assistance.
                </p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium">
                  Start Chat
                </button>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiClock className="text-gray-500 mt-1" size={20} />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Support Hours</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Phone & Chat:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                    <p><strong>Email:</strong> 24/7 (Response within 24 hours)</p>
                    <p><strong>Emergency Support:</strong> Available 24/7 for critical health alerts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-red-600 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-red-900">Emergency Health Situations</h3>
            </div>
            <p className="text-red-700 mb-4">
              For immediate health emergencies affecting your community, use the emergency reporting feature in your dashboard 
              or contact your district health officer directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/dashboard"
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium text-center"
              >
                Go to Emergency Reporting
              </a>
              <a
                href="tel:108"
                className="border border-red-600 text-red-600 px-6 py-2 rounded-md hover:bg-red-50 transition-colors font-medium text-center"
              >
                Call 108 (Ambulance)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;