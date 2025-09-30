import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiPhone, FiArrowLeft, FiLoader } from "react-icons/fi";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    method: "email" // 'email' or 'phone'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError("");
    if (message) setMessage("");
  };

  const handleMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      method,
      identifier: ""
    }));
    setError("");
    setMessage("");
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      setError(`Please enter your ${formData.method === 'email' ? 'email address' : 'phone number'}`);
      return false;
    }

    if (formData.method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.identifier)) {
        setError("Please enter a valid email address");
        return false;
      }
    } else {
      const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.identifier.replace(/\s+/g, ""))) {
        setError("Please enter a valid phone number (10 digits or +91 followed by 10 digits)");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // TODO: Implement forgot password API call when backend is ready
      // const response = await api.post('/auth/forgot-password', {
      //   identifier: formData.identifier,
      //   method: formData.method
      // });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      setMessage(
        `Password reset instructions have been sent to your ${formData.method === 'email' ? 'email' : 'phone number'}. Please check and follow the instructions to reset your password.`
      );
      
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Failed to send reset instructions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <img
                  src="/images/favIcon.png"
                  alt="AquaShield"
                  className="w-6 h-6 object-cover"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-gray-600 mt-2">
              Enter your email or phone number to receive reset instructions
            </p>
          </div>

          {/* Method Selection */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleMethodChange('email')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.method === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FiMail className="mr-2" size={16} />
              Email
            </button>
            <button
              type="button"
              onClick={() => handleMethodChange('phone')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.method === 'phone'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FiPhone className="mr-2" size={16} />
              Phone
            </button>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/Phone Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.method === 'email' ? (
                      <FiMail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type={formData.method === 'email' ? 'email' : 'tel'}
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder={
                      formData.method === 'email' 
                        ? 'Enter your email address' 
                        : 'Enter your phone number'
                    }
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                {formData.method === 'phone' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Example: +91 98765 43210 or 9876543210
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FiLoader className="animate-spin mr-2" size={20} />
                    Sending Instructions...
                  </div>
                ) : (
                  "Send Reset Instructions"
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/app/auth/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <FiArrowLeft className="mr-1" size={16} />
              Back to Login
            </Link>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-xs text-center">
              <strong>Note:</strong> Password reset functionality is coming soon. 
              This is a placeholder page for development purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;