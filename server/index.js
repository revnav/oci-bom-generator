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
const savedPromptsService = require('./services/savedPromptsService');
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
    const allowedTypes = /jpeg|jpg|png|pdf|xlsx|xls|docx|doc|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'text/plain';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, Office documents, and text files are allowed'));
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
      { id: 'gemini', name: 'Google Gemini 2.5 Pro', cost: '$1.25/$5.00 per 1M tokens' },
      { id: 'grok', name: 'xAI Grok-1.5', cost: '$3.00/$15.00 per 1M tokens' },
      { id: 'deepseek', name: 'DeepSeek V3', cost: '$0.27/$1.10 per 1M tokens' }
    ]
  });
});

// Process natural language BOM request
app.post('/api/generate-bom', validateBomRequest, async (req, res) => {
  try {
    const { requirements, llmProvider, followUpAnswers } = req.body;

    console.log(`🔄 BOM Generation started with ${llmProvider}`);
    console.log(`📝 Follow-up answers provided:`, followUpAnswers ? 'Yes' : 'No');
    if (followUpAnswers) {
      console.log(`📋 Follow-up answers count: ${Object.keys(followUpAnswers).length}`);
    }

    // Step 1: Analyze requirements with selected LLM
    console.log(`1️⃣ Analyzing requirements with ${llmProvider}...`);
    const analysis = await llmService.analyzeRequirements(requirements, llmProvider, followUpAnswers);
    
    // Log detected user constraints for debugging
    if (analysis.userConstraints) {
      console.log(`🔒 Detected user constraints:`, JSON.stringify(analysis.userConstraints, null, 2));
    }

    // Step 2: Check if follow-up questions are needed
    // Skip follow-up questions if answers are already provided
    if (analysis.needsFollowUp && (!followUpAnswers || Object.keys(followUpAnswers).length === 0)) {
      console.log(`❓ Follow-up questions needed`);
      return res.json({
        success: true,
        needsFollowUp: true,
        questions: analysis.followUpQuestions,
        partialAnalysis: analysis
      });
    }

    console.log(`✅ Requirements analysis complete`);

    // Step 3: Get OCI services and pricing
    console.log(`2️⃣ Getting OCI services...`);
    const ociServices = await ociService.findMatchingServices(analysis.parsedRequirements);
    console.log(`✅ Found ${ociServices.length} OCI services`);

    // Step 4: Generate final BOM structure with constraint enforcement
    console.log(`3️⃣ Generating BOM with ${llmProvider} and user constraints...`);
    const bomData = await llmService.generateBOM(analysis.parsedRequirements, ociServices, llmProvider);
    console.log(`✅ BOM data generated with ${bomData.items?.length || 0} items`);
    
    // Log final BOM items for constraint verification
    if (bomData.items && analysis.userConstraints) {
      console.log(`🔍 Final BOM items (constraint-filtered):`);
      bomData.items.forEach(item => {
        console.log(`  - ${item.sku}: ${item.description}`);
      });
    }

    // Step 5: Create Excel file
    console.log(`4️⃣ Creating Excel file...`);
    const excelBuffer = await excelGenerator.createBOM(bomData);
    console.log(`✅ Excel file created (${excelBuffer.length} bytes)`);

    // Auto-save the successful prompt
    try {
      await savedPromptsService.savePrompt({
        requirements,
        followUpAnswers,
        llmProvider
      });
      console.log(`💾 Auto-saved prompt to library`);
    } catch (saveError) {
      console.error('⚠️ Failed to auto-save prompt:', saveError.message);
      // Don't fail the BOM generation if save fails
    }

    // Return Excel data as base64 in JSON format for frontend processing
    res.json({
      success: true,
      excelBuffer: excelBuffer.toString('base64'),
      filename: `OCI-BOM-${Date.now()}.xlsx`
    });

    console.log(`🎉 BOM generation completed successfully`);

  } catch (error) {
    console.error('❌ BOM Generation Error:', error);
    console.error('Error stack:', error.stack);
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

// Saved Prompts API Endpoints

// Get all saved prompts
app.get('/api/saved-prompts', async (req, res) => {
  try {
    const prompts = await savedPromptsService.getAllPrompts();
    res.json({ success: true, prompts });
  } catch (error) {
    console.error('Error fetching saved prompts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch saved prompts' });
  }
});

// Get a specific saved prompt
app.get('/api/saved-prompts/:id', async (req, res) => {
  try {
    const prompt = await savedPromptsService.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }
    res.json({ success: true, prompt });
  } catch (error) {
    console.error('Error fetching saved prompt:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch saved prompt' });
  }
});

// Save a new prompt
app.post('/api/saved-prompts', async (req, res) => {
  try {
    const { name, requirements, followUpAnswers, llmProvider } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ success: false, error: 'Requirements are required' });
    }

    const savedPrompt = await savedPromptsService.savePrompt({
      name,
      requirements,
      followUpAnswers,
      llmProvider
    });

    res.json({ success: true, prompt: savedPrompt });
  } catch (error) {
    console.error('Error saving prompt:', error);
    res.status(500).json({ success: false, error: 'Failed to save prompt' });
  }
});

// Update an existing prompt
app.put('/api/saved-prompts/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updatedPrompt = await savedPromptsService.updatePrompt(req.params.id, updates);
    res.json({ success: true, prompt: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    if (error.message === 'Prompt not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to update prompt' });
  }
});

// Delete a saved prompt
app.delete('/api/saved-prompts/:id', async (req, res) => {
  try {
    await savedPromptsService.deletePrompt(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ success: false, error: 'Failed to delete prompt' });
  }
});

// Increment usage count when a prompt is used
app.post('/api/saved-prompts/:id/use', async (req, res) => {
  try {
    await savedPromptsService.incrementUsage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ success: false, error: 'Failed to update usage' });
  }
});

// Get prompt suggestions based on partial text
app.post('/api/saved-prompts/suggestions', async (req, res) => {
  try {
    const { partialText } = req.body;
    const suggestions = await savedPromptsService.getPromptSuggestions(partialText || '');
    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OCI BOM Generator Server running on port ${PORT}`);
  console.log(`📊 Supported LLMs: OpenAI, Claude, Gemini, Grok, DeepSeek`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;