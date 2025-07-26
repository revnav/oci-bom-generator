import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  GlobeAltIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const ParsedDocumentDisplay = ({ parsedContent, filename }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('structured');

  if (!parsedContent) return null;

  const { originalContent, structuredRequirements, infrastructureData } = parsedContent;

  const renderInfrastructureItem = (icon, label, value, unit = '') => {
    if (!value || value.length === 0) return null;
    
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
          <div className="text-sm text-gray-600 mt-1">
            {Array.isArray(value) ? (
              <ul className="space-y-1">
                {value.map((item, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span>{item}{unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>{value}{unit}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Parsed Document Content
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filename || 'Uploaded Document'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('structured')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'structured'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Infrastructure Details
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requirements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Structured Requirements
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'original'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Original Content
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'structured' && infrastructureData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInfrastructureItem(
                    <CpuChipIcon className="w-4 h-4 text-green-600" />,
                    'Compute Requirements',
                    infrastructureData.compute,
                    ' cores'
                  )}
                  
                  {renderInfrastructureItem(
                    <CircleStackIcon className="w-4 h-4 text-purple-600" />,
                    'Memory Requirements',
                    infrastructureData.memory,
                    ' GB'
                  )}
                  
                  {renderInfrastructureItem(
                    <ServerIcon className="w-4 h-4 text-blue-600" />,
                    'Storage Requirements',
                    infrastructureData.storage,
                    ' GB'
                  )}
                  
                  {renderInfrastructureItem(
                    <GlobeAltIcon className="w-4 h-4 text-orange-600" />,
                    'Network Bandwidth',
                    infrastructureData.network,
                    ' Gbps'
                  )}
                  
                  {renderInfrastructureItem(
                    <BuildingOfficeIcon className="w-4 h-4 text-indigo-600" />,
                    'Instances/Servers',
                    infrastructureData.instances,
                    ' servers'
                  )}
                  
                  {renderInfrastructureItem(
                    <UserGroupIcon className="w-4 h-4 text-pink-600" />,
                    'User Capacity',
                    infrastructureData.users,
                    ' users'
                  )}
                </div>
                
                {(!infrastructureData.compute && !infrastructureData.memory && 
                  !infrastructureData.storage && !infrastructureData.network) && (
                  <div className="text-center py-6 text-gray-500">
                    <CpuChipIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No specific infrastructure requirements detected</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Check the other tabs for detailed content
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Extracted Requirements Summary
                  </h4>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap">
                    {structuredRequirements || 'No structured requirements available'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'original' && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Original Document Content
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {originalContent || 'No content available'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsedDocumentDisplay;