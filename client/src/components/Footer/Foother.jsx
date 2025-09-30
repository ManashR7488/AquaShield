import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <FiShield className="text-teal-600 mr-2" size={24} />
              <span className="font-bold text-gray-900">AquaShield</span>
            </div>
            <p className="text-sm text-gray-600">
              Advanced health surveillance platform for Northeast India's communities.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-gray-600 hover:text-teal-600">Home</Link>
              <Link to="/dashboard" className="block text-sm text-gray-600 hover:text-teal-600">Dashboard</Link>
              <Link to="/help" className="block text-sm text-gray-600 hover:text-teal-600">Help Center</Link>
              <Link to="/auth/login" className="block text-sm text-gray-600 hover:text-teal-600">Login</Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
            <div className="space-y-2">
              <a 
                href="mailto:support@aquashield.gov.in" 
                className="flex items-center text-sm text-gray-600 hover:text-teal-600"
              >
                <FiMail className="mr-2" size={14} />
                support@aquashield.gov.in
              </a>
              <a 
                href="tel:+911800123456" 
                className="flex items-center text-sm text-gray-600 hover:text-teal-600"
              >
                <FiMapPin className="mr-2" size={14} />
                Emergency: 1800-123-456
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2025 AquaShield. All rights reserved. | Government of India Health Surveillance Platform
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;