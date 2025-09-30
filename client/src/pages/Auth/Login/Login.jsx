import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMail,
  FiPhone,
  FiLoader,
} from "react-icons/fi";
import useAuthStore from "../../../store/useAuthStore";

const Login = () => {
  const [formData, setFormData] = useState({
    loginMethod: "email", // 'email', 'phone', 'username'
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier) {
      newErrors.identifier = `${getIdentifierLabel()} is required`;
    } else if (
      formData.loginMethod === "email" &&
      !/\S+@\S+\.\S+/.test(formData.identifier)
    ) {
      newErrors.identifier = "Please enter a valid email address";
    } else if (
      formData.loginMethod === "phone" &&
      !/^(\+91)?[6-9]\d{9}$/.test(formData.identifier.replace(/\s+/g, ""))
    ) {
      newErrors.identifier = "Please enter a valid phone number (10 digits or +91 followed by 10 digits)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const credentials = {
        identifier: formData.identifier,
        password: formData.password,
        rememberMe: formData.rememberMe,
      };

      const result = await login(credentials);
      if (result.success) {
        // Navigate to main dashboard - NavBar component handles role-based navigation
        navigate("/app");
      } else {
        // Handle field-specific errors from backend
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        } else if (result.error) {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  const getIdentifierLabel = () => {
    switch (formData.loginMethod) {
      case "email":
        return "Email Address";
      case "phone":
        return "Phone Number";
      case "username":
        return "Username";
      default:
        return "Email Address";
    }
  };

  const getIdentifierIcon = () => {
    switch (formData.loginMethod) {
      case "email":
        return <FiMail size={20} />;
      case "phone":
        return <FiPhone size={20} />;
      case "username":
        return <FiUser size={20} />;
      default:
        return <FiMail size={20} />;
    }
  };

  const getIdentifierPlaceholder = () => {
    switch (formData.loginMethod) {
      case "email":
        return "Enter your email address";
      case "phone":
        return "Enter your phone number";
      case "username":
        return "Enter your username";
      default:
        return "Enter your email address";
    }
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          
          {/* Left Side - Branding & Information */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 md:p-12 flex flex-col justify-center text-white">
            <div className="text-center md:text-left">
              {/* Logo */}
              <div className="flex items-center justify-center md:justify-start mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/images/favIcon.png"
                    alt="AquaShield"
                    className="w-10 h-10 object-cover"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome to AquaShield
              </h1>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Health Surveillance & Early Warning System for Rural Communities
              </p>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center md:justify-start">
                  <div className="w-2 h-2 bg-blue-200 rounded-full mr-3"></div>
                  <span className="text-blue-100">Real-time health monitoring</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <div className="w-2 h-2 bg-blue-200 rounded-full mr-3"></div>
                  <span className="text-blue-100">Water quality surveillance</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <div className="w-2 h-2 bg-blue-200 rounded-full mr-3"></div>
                  <span className="text-blue-100">Community health reporting</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <div className="w-2 h-2 bg-blue-200 rounded-full mr-3"></div>
                  <span className="text-blue-100">Early outbreak detection</span>
                </div>
              </div>

              {/* Stats or Additional Info */}
              <div className="grid grid-cols-3 gap-4 text-center md:text-left">
                <div>
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-xs text-blue-200">Villages Covered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-xs text-blue-200">Health Workers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-xs text-blue-200">Monitoring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="w-full max-w-sm mx-auto">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-gray-600">
                  Access your health surveillance dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Login Method Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Login Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["email", "phone", "username"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            loginMethod: method,
                            identifier: "",
                          }))
                        }
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                          formData.loginMethod === method
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {method === "email"
                          ? "Email"
                          : method === "phone"
                          ? "Phone"
                          : "Username"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Identifier Input */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {getIdentifierLabel()}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {getIdentifierIcon()}
                    </div>
                    <input
                      type={formData.loginMethod === "email" ? "email" : "text"}
                      id="identifier"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleInputChange}
                      placeholder={getIdentifierPlaceholder()}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.identifier ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.identifier}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiLock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/app/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" size={20} />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/app/auth/signup"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  © 2025 AquaShield. Health Surveillance System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
