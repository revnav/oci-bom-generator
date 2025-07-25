import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">OCI BOM Generator</h1>
        <p>AI-Powered Cloud Infrastructure Pricing</p>
      </header>
      
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Welcome to OCI BOM Generator</h2>
          <p className="text-gray-600 mb-4">
            Transform natural language requirements into professional Oracle Cloud Infrastructure 
            Bills of Materials using advanced AI technology.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Getting Started:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Add your LLM API keys to server/.env</li>
              <li>Describe your infrastructure requirements</li>
              <li>Upload supporting documents (optional)</li>
              <li>Generate your professional BOM</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;