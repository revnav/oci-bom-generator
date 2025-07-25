import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CloudIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {/* Company Logo Placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <CloudIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  [COMPANY NAME]
                </h1>
                <p className="text-sm text-gray-600">
                  Oracle Cloud Solutions
                </p>
              </div>
            </div>
          </div>

          {/* Application Title */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CpuChipIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  OCI BOM Generator
                </h2>
                <p className="text-sm text-gray-600">
                  AI-Powered Bill of Materials Creator
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Generator
            </Link>
            <Link
              to="/about"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              About
            </Link>
          </nav>
        </div>

        {/* Breadcrumb or status bar */}
        <div className="border-t border-gray-100 py-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>✨ Powered by Multi-LLM AI</span>
              <span>•</span>
              <span>🔒 Enterprise Ready</span>
              <span>•</span>
              <span>⚡ Real-time OCI Pricing</span>
            </div>
            <div className="text-xs">
              Version 1.0 | Updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;