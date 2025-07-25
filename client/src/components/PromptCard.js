import React, { useState } from 'react';
import {
  PlayIcon,
  TrashIcon,
  FolderIcon,
  ClockIcon,
  ChartBarIcon,
  TagIcon,
  CalendarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const PromptCard = ({ prompt, onUse, onDelete, isDeleting }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullRequirements, setShowFullRequirements] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  const getLLMDisplayName = (provider) => {
    const providers = {
      'claude': 'Claude 3.7',
      'openai': 'GPT-4o',
      'gemini': 'Gemini 2.5',
      'grok': 'Grok-1.5',
      'deepseek': 'DeepSeek V3'
    };
    return providers[provider] || provider;
  };

  const getLLMColor = (provider) => {
    const colors = {
      'claude': 'bg-orange-100 text-orange-800',
      'openai': 'bg-green-100 text-green-800',
      'gemini': 'bg-blue-100 text-blue-800',
      'grok': 'bg-purple-100 text-purple-800',
      'deepseek': 'bg-indigo-100 text-indigo-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Web Applications': 'bg-blue-100 text-blue-800',
      'E-commerce': 'bg-green-100 text-green-800',
      'Enterprise Applications': 'bg-purple-100 text-purple-800',
      'Data & Analytics': 'bg-yellow-100 text-yellow-800',
      'AI & Machine Learning': 'bg-pink-100 text-pink-800',
      'Mobile Applications': 'bg-cyan-100 text-cyan-800',
      'Infrastructure': 'bg-gray-100 text-gray-800',
      'Database Systems': 'bg-red-100 text-red-800',
      'Content Management': 'bg-teal-100 text-teal-800',
      'IoT & Edge': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasFollowUpAnswers = prompt.followUpAnswers && Object.keys(prompt.followUpAnswers).length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {prompt.name}
          </h3>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={onUse}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Use this prompt"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete this prompt"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category and LLM */}
        <div className="flex items-center space-x-2 mb-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(prompt.category)}`}>
            <FolderIcon className="w-3 h-3 mr-1" />
            {prompt.category}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLLMColor(prompt.llmProvider)}`}>
            <CpuChipIcon className="w-3 h-3 mr-1" />
            {getLLMDisplayName(prompt.llmProvider)}
          </span>
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                <TagIcon className="w-2 h-2 mr-1" />
                {tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{prompt.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {showFullDescription || prompt.description.length <= 120
              ? prompt.description
              : truncateText(prompt.description, 120)
            }
            {prompt.description.length > 120 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="ml-1 text-blue-600 hover:text-blue-700 text-xs"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>

        {/* Requirements Preview */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Requirements:</div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 leading-relaxed">
              {showFullRequirements || prompt.requirements.length <= 150
                ? prompt.requirements
                : truncateText(prompt.requirements, 150)
              }
              {prompt.requirements.length > 150 && (
                <button
                  onClick={() => setShowFullRequirements(!showFullRequirements)}
                  className="ml-1 text-blue-600 hover:text-blue-700"
                >
                  {showFullRequirements ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Follow-up Answers Indicator */}
        {hasFollowUpAnswers && (
          <div className="mb-3">
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Includes follow-up answers ({Object.keys(prompt.followUpAnswers).length})
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              Created {formatDate(prompt.createdAt)}
            </div>
            <div className="flex items-center">
              <ChartBarIcon className="w-3 h-3 mr-1" />
              Used {prompt.usageCount || 0} times
            </div>
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatTimeAgo(prompt.lastUsed || prompt.createdAt)}
          </div>
        </div>
      </div>

      {/* Use Button */}
      <div className="p-4 pt-0">
        <button
          onClick={onUse}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlayIcon className="w-4 h-4" />
          <span>Use This Prompt</span>
        </button>
      </div>
    </div>
  );
};

export default PromptCard;