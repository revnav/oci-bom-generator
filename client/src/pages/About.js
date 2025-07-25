import React from 'react';
import { 
  SparklesIcon,
  DocumentTextIcon,
  CloudIcon,
  CpuChipIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const features = [
    {
      icon: SparklesIcon,
      title: 'Multi-LLM AI Engine',
      description: 'Choose from 5 leading AI providers including OpenAI, Claude, Gemini, Grok, and DeepSeek for optimal results based on your specific needs.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Document Intelligence',
      description: 'Upload PDFs, Excel files, Word documents, or images. Our AI extracts infrastructure requirements using advanced OCR and document parsing.'
    },
    {
      icon: CloudIcon,
      title: 'Real-time OCI Pricing',
      description: 'Access live Oracle Cloud Infrastructure pricing data with automatic service matching and cost calculations across multiple currencies.'
    },
    {
      icon: ChartBarIcon,
      title: 'Professional Excel Output',
      description: 'Generate presentation-ready BOMs with detailed pricing, discount formulas, and professional formatting suitable for executive presentations.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Built with enterprise-grade security including rate limiting, input validation, and secure file processing for business-critical use cases.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Intelligent Follow-up',
      description: 'AI-powered clarification system asks targeted questions to ensure accurate BOMs based on your specific infrastructure requirements.'
    }
  ];

  const useCases = [
    {
      title: 'Pre-Sales Engineering',
      description: 'Quickly generate accurate BOMs for customer proposals and RFP responses.',
      users: 'Sales Engineers, Solution Architects'
    },
    {
      title: 'Cloud Migration Planning',
      description: 'Estimate costs for migrating existing workloads to Oracle Cloud.',
      users: 'Cloud Architects, Migration Teams'
    },
    {
      title: 'Executive Presentations',
      description: 'Create professional cost estimates for board meetings and stakeholder reviews.',
      users: 'Executives, Finance Teams'
    },
    {
      title: 'RFP Responses',
      description: 'Generate detailed pricing for complex procurement requirements.',
      users: 'Bid Teams, Proposal Writers'
    }
  ];

  const llmComparison = [
    {
      provider: 'Claude 3.7 Sonnet',
      strength: 'Structured Analysis',
      cost: '$3.00/$15.00 per 1M tokens',
      bestFor: 'Complex requirements analysis'
    },
    {
      provider: 'Google Gemini 2.5 Pro',
      strength: 'Document Processing',
      cost: '$2.50/$15.00 per 1M tokens',
      bestFor: 'Multi-modal document parsing'
    },
    {
      provider: 'OpenAI GPT-4o',
      strength: 'General Purpose',
      cost: '$2.50/$10.00 per 1M tokens',
      bestFor: 'Balanced performance'
    },
    {
      provider: 'DeepSeek V3',
      strength: 'Cost Efficiency',
      cost: '$0.27/$1.10 per 1M tokens',
      bestFor: 'High-volume processing'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <CpuChipIcon className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                OCI BOM Generator
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Transform natural language requirements into professional Oracle Cloud Infrastructure 
              Bills of Materials using advanced AI technology.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5" />
                <span>5 AI Providers</span>
              </div>
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5" />
                <span>Multi-format Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Professional Output</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Cloud Professionals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for cloud architects, pre-sales engineers, and solution designers 
              who need accurate OCI pricing quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Your Use Cases
            </h2>
            <p className="text-lg text-gray-600">
              Designed to solve real-world challenges faced by cloud professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {useCase.description}
                </p>
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <UsersIcon className="w-4 h-4" />
                  <span>{useCase.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LLM Comparison Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your AI Provider
            </h2>
            <p className="text-lg text-gray-600">
              Different AI models excel at different tasks. Pick the right one for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {llmComparison.map((llm, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {llm.provider}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {llm.strength}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>Best for:</strong> {llm.bestFor}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Pricing:</strong> {llm.cost}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple 4-step process to generate professional BOMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Describe Requirements',
                description: 'Write your infrastructure needs in natural language or upload documents.'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our AI analyzes requirements and may ask clarifying questions.'
              },
              {
                step: '3',
                title: 'Service Matching',
                description: 'Automatically matches your needs to OCI services with real-time pricing.'
              },
              {
                step: '4',
                title: 'Professional BOM',
                description: 'Download a formatted Excel BOM ready for presentations.'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Generate Your First BOM?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start creating professional Oracle Cloud Infrastructure bills of materials 
            with AI-powered analysis and real-time pricing.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Start Generating BOMs
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;