import React from 'react';
import { 
  HeartIcon,
  CloudIcon,
  ShieldCheckIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <CloudIcon className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold">[COMPANY NAME]</h3>
                <p className="text-sm text-gray-400">Oracle Cloud Solutions</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Empowering businesses with AI-driven Oracle Cloud Infrastructure solutions. 
              Generate accurate BOMs with real-time pricing using advanced LLM technology.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center space-x-1">
                <GlobeAltIcon className="w-4 h-4" />
                <span>Global Deployment</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Multi-LLM Support</li>
              <li>Document Processing</li>
              <li>Real-time OCI Pricing</li>
              <li>Professional Excel Output</li>
              <li>Natural Language Processing</li>
              <li>Follow-up Questions</li>
            </ul>
          </div>

          {/* Supported Models */}
          <div>
            <h4 className="text-white font-semibold mb-4">AI Models</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>OpenAI GPT-4o</li>
              <li>Claude 3.7 Sonnet</li>
              <li>Google Gemini 2.5 Pro</li>
              <li>xAI Grok-1.5</li>
              <li>DeepSeek V3</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              <p>
                © {currentYear} [COMPANY NAME]. All rights reserved. 
                Oracle Cloud Infrastructure BOM Generator.
              </p>
            </div>

            {/* Made with love */}
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>Made with</span>
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>for cloud architects</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-xs text-gray-500 space-y-2">
            <p>
              <strong>Disclaimer:</strong> This tool provides estimates based on Oracle Cloud Infrastructure 
              list prices. Actual costs may vary based on usage patterns, regional pricing, discounts, 
              and specific contract terms. Please consult with Oracle sales representatives for official 
              pricing and enterprise agreements.
            </p>
            <p>
              OCI pricing data is updated regularly but may not reflect the most current rates. 
              This tool is designed for planning and estimation purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;