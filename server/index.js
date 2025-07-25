const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const llmService = require('./services/llmService');
const ociService = require('./services/ociService');
const documentParser = require('./services/documentParser');
const excelGenerator = require('./services/excelGenerator');
const { validateBomRequest } = require('./middleware/validation');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimiter);

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|xlsx|xls|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Office documents are allowed'));
    }
  }
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      llm: 'operational',
      oci: 'operational',
      excel: 'operational'
    }
  });
});

// Get available LLM providers
app.get('/api/llm-providers', (req, res) => {
  res.json({
    providers: [
      { id: 'openai', name: 'OpenAI GPT-4o', cost: '$2.50/$10.00 per 1M tokens' },
      { id: 'claude', name: 'Claude 3.7 Sonnet', cost: '$3.00/$15.00 per 1M tokens' },
      { id: 'gemini', name: 'Google Gemini 2.5 Pro', cost: '$2.50/$15.00 per 1M tokens' },
      { id: 'grok', name: 'xAI Grok-1.5', cost: '$3.00/$15.00 per 1M tokens' },
      { id: 'deepseek', name: 'DeepSeek V3', cost: '$0.27/$1.10 per 1M tokens' }
    ]
  });
});

// Process natural language BOM request
app.post('/api/generate-bom', validateBomRequest, async (req, res) => {
  try {
    const { requirements, llmProvider, followUpAnswers } = req.body;

    // Step 1: Analyze requirements with selected LLM
    const analysis = await llmService.analyzeRequirements(requirements, llmProvider, followUpAnswers);

    // Step 2: Check if follow-up questions are needed
    if (analysis.needsFollowUp) {
      return res.json({
        success: true,
        needsFollowUp: true,
        questions: analysis.followUpQuestions,
        partialAnalysis: analysis
      });
    }

    // Step 3: Get OCI services and pricing
    const ociServices = await ociService.findMatchingServices(analysis.parsedRequirements);

    // Step 4: Generate final BOM structure
    const bomData = await llmService.generateBOM(analysis.parsedRequirements, ociServices, llmProvider);

    // Step 5: Create Excel file
    const excelBuffer = await excelGenerator.createBOM(bomData);

    // Return Excel data as base64 in JSON format for frontend processing
    res.json({
      success: true,
      excelBuffer: excelBuffer.toString('base64'),
      filename: `OCI-BOM-${Date.now()}.xlsx`
    });

  } catch (error) {
    console.error('BOM Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate BOM',
      message: error.message
    });
  }
});

// Upload and parse documents
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { llmProvider } = req.body;
    const parsedContent = await documentParser.parseDocument(req.file, llmProvider);

    res.json({
      success: true,
      content: parsedContent,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Document parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse document',
      message: error.message
    });
  }
});

// Get OCI service categories
app.get('/api/oci-categories', async (req, res) => {
  try {
    const categories = await ociService.getServiceCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch OCI categories' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OCI BOM Generator Server running on port ${PORT}`);
  console.log(`📊 Supported LLMs: OpenAI, Claude, Gemini, Grok, DeepSeek`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;