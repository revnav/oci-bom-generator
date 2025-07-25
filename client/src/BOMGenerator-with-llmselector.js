import React, { useState } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import LLMSelector from './components/LLMSelector';
import { 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  SparklesIcon,
  CpuChipIcon 
} from '@heroicons/react/24/outline';

const BOMGeneratorWithLLMSelector = () => {
  const [requirements, setRequirements] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('claude');
  const [isLoading, setIsLoading] = useState(false);

  // Mock LLM providers data
  const mockProviders = [
    { id: 'openai', name: 'OpenAI GPT-4o', cost: '$2.50/$10.00 per 1M tokens' },
    { id: 'claude', name: 'Claude 3.7 Sonnet', cost: '$3.00/$15.00 per 1M tokens' },
    { id: 'gemini', name: 'Google Gemini 2.5 Pro', cost: '$2.50/$15.00 per 1M tokens' },
    { id: 'grok', name: 'xAI Grok-1.5', cost: '$3.00/$15.00 per 1M tokens' },
    { id: 'deepseek', name: 'DeepSeek V3', cost: '$0.27/$1.10 per 1M tokens' }
  ];

  const testSpinner = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <SparklesIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Testing LLMSelector Component
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Testing if the LLMSelector component (using @headlessui) is causing the blank page issue.
        </p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 Component Testing Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">LoadingSpinner</h3>
            <p className="text-sm text-green-600">Fixed!</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CpuChipIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">LLMSelector</h3>
            <p className="text-sm text-blue-600">Testing</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-600 font-bold">?</span>
            </div>
            <h3 className="font-medium text-gray-900">Other Components</h3>
            <p className="text-sm text-gray-600">Next</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-600 font-bold">?</span>
            </div>
            <h3 className="font-medium text-gray-900">Full BOM</h3>
            <p className="text-sm text-gray-600">Final</p>
          </div>
        </div>
      </div>

      {/* Test LoadingSpinner */}
      <div className="bg-green-50 rounded-lg p-6 mb-6">
        <h3 className="font-medium text-green-900 mb-3">✅ LoadingSpinner Test Results</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={testSpinner}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Spinner (3 seconds)
          </button>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-green-700">Loading...</span>
            </div>
          )}
        </div>
        <p className="text-sm text-green-700 mt-2">
          ✅ LoadingSpinner works correctly! Invalid CSS classes were fixed.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Provider (LLMSelector Test)</h2>
            </div>
            <LLMSelector
              providers={mockProviders}
              selected={selectedLLM}
              onSelect={setSelectedLLM}
            />
            <div className="mt-3 text-sm text-gray-600">
              <p>Selected: <strong>{selectedLLM}</strong></p>
              <p>This tests the @headlessui/react Listbox component.</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">LLMSelector Test</h3>
            <p className="text-sm text-blue-700">
              If you can see this page and the dropdown works, then LLMSelector is not the issue.
              Try clicking the dropdown above to test it.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Infrastructure Requirements
            </h2>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Test requirements input..."
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="w-5 h-5" />
                  <span>Test Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMGeneratorWithLLMSelector;