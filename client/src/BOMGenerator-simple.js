import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  SparklesIcon,
  CpuChipIcon 
} from '@heroicons/react/24/outline';

const BOMGeneratorSimple = () => {
  const [requirements, setRequirements] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('claude');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <SparklesIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Generate Your OCI Bill of Materials
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Describe your infrastructure requirements in natural language or upload documents. 
          Our AI will analyze your needs and generate a detailed OCI BOM with accurate pricing.
        </p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Testing BOM Generator Component
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">Basic BOM Page</h3>
            <p className="text-sm text-green-600">Loading</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">→</span>
            </div>
            <h3 className="font-medium text-gray-900">Sub-components</h3>
            <p className="text-sm text-blue-600">Next Test</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-600 font-bold">?</span>
            </div>
            <h3 className="font-medium text-gray-900">Full Generator</h3>
            <p className="text-sm text-gray-600">Final</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* LLM Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Provider</h2>
            </div>
            <select 
              value={selectedLLM}
              onChange={(e) => setSelectedLLM(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="claude">Claude 3.7 Sonnet</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="gemini">Google Gemini 2.5 Pro</option>
              <option value="grok">xAI Grok-1.5</option>
              <option value="deepseek">DeepSeek V3</option>
            </select>
          </div>

          {/* Document Upload Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-gray-600">Document upload component will be tested next</p>
            </div>
          </div>
        </div>

        {/* Right Column - Input and Generation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Infrastructure Requirements
            </h2>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your infrastructure needs... For example:

• We need a web application that can handle 10,000 concurrent users
• Database with high availability and backup
• Load balancing and CDN for global users
• Development, staging, and production environments
• Monitoring and logging capabilities
• Estimated monthly budget: $5,000"
            />
          </div>

          {/* Generation Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Generate BOM
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create a professional Excel BOM with OCI services and pricing
                </p>
              </div>
              <button
                disabled={!requirements.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CloudArrowDownIcon className="w-5 h-5" />
                <span>Generate BOM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMGeneratorSimple;