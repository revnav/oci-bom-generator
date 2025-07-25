import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Simple Home component
const Home = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Generate Your OCI Bill of Materials
      </h1>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
        Describe your infrastructure requirements in natural language or upload documents. 
        Our AI will analyze your needs and generate a detailed OCI BOM with accurate pricing.
      </p>
    </div>

    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Start Guide
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">1. Configure API Keys</h3>
          <p className="text-sm text-gray-600">
            Add your LLM API keys to server/.env file to enable AI processing.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">2. Describe Requirements</h3>
          <p className="text-sm text-gray-600">
            Write your infrastructure needs in natural language.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Simple About component
const About = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">About OCI BOM Generator</h1>
    <p className="text-lg text-gray-600 mb-6">
      AI-powered tool for generating Oracle Cloud Infrastructure Bills of Materials.
    </p>
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="font-medium text-blue-900 mb-3">Features</h3>
      <ul className="text-blue-800 space-y-2">
        <li>• Multi-LLM AI Support (OpenAI, Claude, Gemini, Grok, DeepSeek)</li>
        <li>• Document Upload & Processing</li>
        <li>• Real-time OCI Pricing</li>
        <li>• Professional Excel Output</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">OCI</span>
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
              <div className="flex-1 text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  OCI BOM Generator
                </h2>
                <p className="text-sm text-gray-600">
                  AI-Powered Bill of Materials Creator
                </p>
              </div>
              <nav className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                >
                  Generator
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                >
                  About
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-300">
              © 2025 [COMPANY NAME]. Oracle Cloud Infrastructure BOM Generator.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;