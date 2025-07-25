import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
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

// Simple Home component
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
          🚀 Testing Custom Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">Header Component</h3>
            <p className="text-sm text-green-600">Loaded</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <h3 className="font-medium text-gray-900">Footer Component</h3>
            <p className="text-sm text-green-600">Loaded</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">→</span>
            </div>
            <h3 className="font-medium text-gray-900">Page Components</h3>
            <p className="text-sm text-blue-600">Next Test</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">Progress Update</h3>
        <div className="space-y-2 text-blue-800">
          <p>✅ React Router, React Query, Toast Notifications working</p>
          <p>✅ Custom Header and Footer components working</p>
          <p>🔄 Next: Testing page components (BOMGenerator, About)</p>
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
      Testing custom components integration.
    </p>
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="font-medium text-blue-900 mb-3">Component Status</h3>
      <ul className="text-blue-800 space-y-2">
        <li>✅ Header with @heroicons working</li>
        <li>✅ Footer with complex layout working</li>
        <li>✅ Navigation between pages working</li>
        <li>🔄 Ready for full BOM Generator component</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-50 flex flex-col">
          <Header />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          
          <Footer />
          
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