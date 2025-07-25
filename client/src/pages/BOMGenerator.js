import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import LLMSelector from '../components/LLMSelector';
import RequirementsInput from '../components/RequirementsInput';
import DocumentUpload from '../components/DocumentUpload';
import FollowUpQuestions from '../components/FollowUpQuestions';
import LoadingSpinner from '../components/LoadingSpinner';
import SavedPrompts from '../components/SavedPrompts';
import { generateBOM, uploadDocument, getLLMProviders } from '../services/api';
import { 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  SparklesIcon,
  CpuChipIcon,
  BookmarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const BOMGenerator = () => {
  const [activeView, setActiveView] = useState('create'); // 'create' or 'saved'
  const [selectedLLM, setSelectedLLM] = useState('claude');
  const [requirements, setRequirements] = useState('');
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(null); // For future editing functionality
  const [currentPromptName, setCurrentPromptName] = useState(null);

  // Fetch available LLM providers
  const { data: llmProviders, isLoading: providersLoading } = useQuery(
    'llm-providers',
    getLLMProviders,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // BOM generation mutation
  const bomMutation = useMutation(generateBOM, {
    onSuccess: (data) => {
      if (data.needsFollowUp) {
        setFollowUpQuestions(data.questions);
        setShowFollowUp(true);
        toast.success('Please answer the follow-up questions to continue');
      } else if (data.success && data.excelBuffer) {
        // Handle Excel file download - convert base64 to blob
        const byteCharacters = atob(data.excelBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `OCI-BOM-${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('BOM generated successfully! File downloaded.');
        setShowFollowUp(false); // Hide follow-up questions
        resetForm();
      } else {
        toast.error('Unexpected response format from server');
      }
    },
    onError: (error) => {
      console.error('BOM generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate BOM');
    }
  });

  // Document upload mutation
  const uploadMutation = useMutation(uploadDocument, {
    onSuccess: (data) => {
      setUploadedDocument(data);
      setRequirements(prev => {
        const additionalContent = `\\n\\n--- From uploaded document (${data.filename}) ---\\n${data.structuredRequirements}`;
        return prev + additionalContent;
      });
      toast.success(`Document "${data.filename}" parsed successfully`);
    },
    onError: (error) => {
      console.error('Document upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to parse document');
    }
  });

  const handleGenerateBOM = async () => {
    if (!requirements.trim()) {
      toast.error('Please provide requirements or upload a document');
      return;
    }

    if (!selectedLLM) {
      toast.error('Please select an LLM provider');
      return;
    }

    const requestData = {
      requirements: requirements.trim(),
      llmProvider: selectedLLM,
      ...(showFollowUp && Object.keys(followUpAnswers).length > 0 && { followUpAnswers })
    };

    bomMutation.mutate(requestData);
  };

  const handleDocumentUpload = (file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('llmProvider', selectedLLM);
    
    uploadMutation.mutate(formData);
  };

  const handleFollowUpSubmit = () => {
    // Generate BOM with follow-up answers
    const requestData = {
      requirements: requirements.trim(),
      llmProvider: selectedLLM,
      followUpAnswers: followUpAnswers
    };

    bomMutation.mutate(requestData);
  };

  const resetForm = () => {
    setRequirements('');
    setUploadedDocument(null);
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setShowFollowUp(false);
    setCurrentPromptId(null);
    setCurrentPromptName(null);
  };

  const handleUseSavedPrompt = (promptData) => {
    setRequirements(promptData.requirements);
    setFollowUpAnswers(promptData.followUpAnswers || {});
    setSelectedLLM(promptData.llmProvider);
    setCurrentPromptId(promptData.promptId);
    setCurrentPromptName(promptData.promptName);
    
    // If the prompt has follow-up answers, skip the follow-up questions
    if (promptData.followUpAnswers && Object.keys(promptData.followUpAnswers).length > 0) {
      setShowFollowUp(false);
    }
    
    // Switch to create view
    setActiveView('create');
  };

  const handleCreateNew = () => {
    resetForm();
    setActiveView('create');
  };

  const isLoading = bomMutation.isLoading || uploadMutation.isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <SparklesIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            OCI Bill of Materials Generator
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Create new BOMs or reuse saved prompts. Our AI analyzes your requirements and generates detailed OCI BOMs with accurate pricing.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
          <button
            onClick={() => setActiveView('create')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
              activeView === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create New BOM</span>
          </button>
          <button
            onClick={() => setActiveView('saved')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
              activeView === 'saved'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>Saved Prompts</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      {activeView === 'saved' ? (
        <SavedPrompts 
          onUsePrompt={handleUseSavedPrompt}
          onCreateNew={handleCreateNew}
        />
      ) : (
        <>
          {/* Current Prompt Info */}
          {currentPromptName && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BookmarkIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Using saved prompt:</span>
                <span className="text-blue-700">{currentPromptName}</span>
                <button
                  onClick={() => {
                    setCurrentPromptId(null);
                    setCurrentPromptName(null);
                  }}
                  className="ml-auto text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* LLM Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Provider</h2>
            </div>
            {providersLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <LLMSelector
                providers={llmProviders?.providers || []}
                selected={selectedLLM}
                onSelect={setSelectedLLM}
              />
            )}
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
            </div>
            <DocumentUpload
              onUpload={handleDocumentUpload}
              isLoading={uploadMutation.isLoading}
              uploadedDocument={uploadedDocument}
            />
          </div>

          {/* Generation Stats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Supported Formats</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• PDF documents</li>
              <li>• Excel spreadsheets</li>
              <li>• Word documents</li>
              <li>• Images (OCR)</li>
              <li>• Natural language text</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Input and Generation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Infrastructure Requirements
            </h2>
            <RequirementsInput
              value={requirements}
              onChange={setRequirements}
              placeholder="Describe your infrastructure needs... For example:\\n\\n• We need a web application that can handle 10,000 concurrent users\\n• Database with high availability and backup\\n• Load balancing and CDN for global users\\n• Development, staging, and production environments\\n• Monitoring and logging capabilities\\n• Estimated monthly budget: $5,000"
            />
          </div>

          {/* Follow-up Questions */}
          {showFollowUp && (
            <div className="bg-yellow-50 rounded-lg shadow-md p-6 border border-yellow-200">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">
                Additional Information Needed
              </h2>
              <FollowUpQuestions
                questions={followUpQuestions}
                answers={followUpAnswers}
                onAnswersChange={setFollowUpAnswers}
                onSubmit={handleFollowUpSubmit}
                isLoading={isLoading}
              />
            </div>
          )}

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
                onClick={handleGenerateBOM}
                disabled={isLoading || !requirements.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowDownIcon className="w-5 h-5" />
                    <span>Generate BOM</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Indicator */}
            {isLoading && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <LoadingSpinner size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadMutation.isLoading 
                        ? 'Processing uploaded document...' 
                        : 'Analyzing requirements and generating BOM...'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This may take 30-60 seconds depending on complexity
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-3">💡 Tips for Better Results</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Be specific about performance requirements (CPU, RAM, storage)</li>
              <li>• Mention expected user load and traffic patterns</li>
              <li>• Include compliance or security requirements</li>
              <li>• Specify geographic regions for deployment</li>
              <li>• Describe backup and disaster recovery needs</li>
              <li>• Upload existing architecture diagrams or specifications</li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default BOMGenerator;