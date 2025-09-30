import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome,
  FiArrowLeft,
  FiSearch,
  FiHelpCircle,
  FiShield,
  FiMapPin,
  FiRefreshCw
} from 'react-icons/fi';
import Footer from '../../components/Footer/Foother';

const NotFoundPage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const quickLinks = [
    {
      title: 'Dashboard',
      description: 'Access your health monitoring dashboard',
      icon: FiHome,
      link: '/dashboard',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Help Center',
      description: 'Find answers and support resources',
      icon: FiHelpCircle,
      link: '/help',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Profile',
      description: 'Manage your account settings',
      icon: FiShield,
      link: '/profile',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Emergency Contact',
      description: 'Report urgent health situations',
      icon: FiMapPin,
      link: '/emergency',
      color: 'bg-red-100 text-red-600'
    }
  ];

  const commonIssues = [
    {
      issue: 'Typed URL incorrectly',
      solution: 'Check the web address for typos and try again'
    },
    {
      issue: 'Page has been moved or deleted',
      solution: 'Use the navigation menu to find what you need'
    },
    {
      issue: 'Temporary server issue',
      solution: 'Try refreshing the page or come back later'
    },
    {
      issue: 'Insufficient permissions',
      solution: 'Make sure you\'re logged in with the correct account'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <FiShield className="text-teal-600 mr-3" size={28} />
            <span className="text-gray-900 font-bold text-xl">AquaShield</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full mb-6">
              <span className="text-white font-bold text-5xl">404</span>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              The page you're looking for doesn't exist or has been moved. 
              Don't worry, let's get you back to protecting community health.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/"
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <FiHome className="mr-2" size={20} />
                Go to Homepage
              </Link>
              <button
                onClick={handleGoBack}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <FiArrowLeft className="mr-2" size={20} />
                Go Back
              </button>
              <button
                onClick={handleRefresh}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" size={20} />
                Refresh Page
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.link}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <link.icon size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center mb-4">
              <FiSearch className="text-blue-600 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Try Searching</h3>
            </div>
            <p className="text-gray-600 mb-4">
              If you know what you're looking for, use our search feature to find specific health data, reports, or resources.
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for health data, reports, communities..."
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600">
                <FiSearch size={20} />
              </button>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Common Issues & Solutions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {commonIssues.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.issue}</h4>
                  <p className="text-sm text-gray-600">{item.solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NotFoundPage;