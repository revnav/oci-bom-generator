import React, { useState } from 'react';
import { 
  PencilSquareIcon, 
  ClipboardDocumentCheckIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

const RequirementsInput = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const wordCount = value.trim().split(/\\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;
  const maxChars = 10000;

  const handleClear = () => {
    onChange('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(value + '\\n\\n' + text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const exampleRequirements = [
    {
      title: "E-commerce Platform",
      content: "We need to build a high-traffic e-commerce platform that can handle 50,000 concurrent users during peak times. Requirements include:\\n\\n• Web application servers with auto-scaling\\n• MySQL database with read replicas\\n• Redis cache for session management\\n• CDN for global content delivery\\n• Load balancer with SSL termination\\n• File storage for product images\\n• Backup and monitoring solutions\\n• Development, staging, and production environments"
    },
    {
      title: "Data Analytics Platform",
      content: "Building a real-time data analytics platform for processing customer data:\\n\\n• Data warehouse for storing 100TB of historical data\\n• Real-time streaming data processing\\n• Machine learning model training and inference\\n• API gateway for data access\\n• Kubernetes cluster for microservices\\n• Monitoring and alerting system\\n• Compliance with GDPR and SOC2\\n• Multi-region deployment for disaster recovery"
    },
    {
      title: "Enterprise SaaS Application",
      content: "Multi-tenant SaaS application for enterprise customers:\\n\\n• Support for 10,000 organizations with 100,000 total users\\n• High availability with 99.9% uptime SLA\\n• PostgreSQL database with automated backups\\n• Elasticsearch for search functionality\\n• Message queue for background processing\\n• Container orchestration platform\\n• Identity and access management\\n• Comprehensive logging and monitoring\\n• Global deployment across 3 regions"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Example Templates */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start Templates:</h3>
        <div className="flex flex-wrap gap-2">
          {exampleRequirements.map((example, index) => (
            <button
              key={index}
              onClick={() => onChange(example.content)}
              className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Area */}
      <div className="relative">
        <div className={`border-2 rounded-lg transition-colors ${
          isFocused ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}>
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <PencilSquareIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Infrastructure Requirements
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePaste}
                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Paste from clipboard"
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
              </button>
              {value && (
                <button
                  onClick={handleClear}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Clear all text"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full h-64 p-4 resize-none border-none focus:outline-none bg-transparent"
            maxLength={maxChars}
          />
          
          {/* Character/Word Count */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              {wordCount} words • {charCount}/{maxChars} characters
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className={charCount > maxChars * 0.9 ? 'text-orange-500' : ''}>
                {charCount > maxChars * 0.9 && '⚠️ '}
                {((charCount / maxChars) * 100).toFixed(0)}% used
              </span>
            </div>
          </div>
        </div>

        {/* Writing Tips */}
        {isFocused && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
            <h4 className="font-medium text-gray-900 mb-2">Writing Tips:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Be specific about performance requirements</li>
              <li>• Include expected user load and traffic</li>
              <li>• Mention data storage and backup needs</li>
              <li>• Specify geographic regions if relevant</li>
              <li>• Describe security and compliance requirements</li>
              <li>• Include budget constraints if applicable</li>
            </ul>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {charCount > maxChars && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          ⚠️ Text exceeds maximum length. Please shorten your requirements.
        </div>
      )}
    </div>
  );
};

export default RequirementsInput;