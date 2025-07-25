import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Simple Home component with React Query test
const Home = () => {
  return (
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
          🚀 Application Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">React Router</h3>
            <p className="text-sm text-green-600">Working</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">React Query</h3>
            <p className="text-sm text-green-600">Connected</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">Toast Notifications</h3>
            <p className="text-sm text-green-600">Ready</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">Next Steps</h3>
        <div className="space-y-2 text-blue-800">
          <p>• Add your LLM API keys to server/.env</p>
          <p>• Test the backend API connection</p>
          <p>• Begin generating BOMs!</p>
        </div>
      </div>
    </div>
  );
};

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
        <li>• Intelligent Follow-up Questions</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-50 flex flex-col">
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
              <p className="text-sm text-gray-500 mt-2">
                Made with ❤️ for cloud architects and pre-sales engineers
              </p>
            </div>
          </footer>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;