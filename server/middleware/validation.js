const Joi = require('joi');

// Validation schemas
const bomRequestSchema = Joi.object({
  requirements: Joi.string().min(10).max(10000).required()
    .messages({
      'string.empty': 'Requirements cannot be empty',
      'string.min': 'Requirements must be at least 10 characters long',
      'string.max': 'Requirements cannot exceed 10,000 characters',
      'any.required': 'Requirements are required'
    }),
  
  llmProvider: Joi.string().valid('openai', 'claude', 'gemini', 'grok', 'deepseek').required()
    .messages({
      'any.only': 'LLM provider must be one of: openai, claude, gemini, grok, deepseek',
      'any.required': 'LLM provider is required'
    }),

  followUpAnswers: Joi.object().optional()
    .messages({
      'object.base': 'Follow-up answers must be a valid object'
    }),

  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD').default('USD')
    .messages({
      'any.only': 'Currency must be one of: USD, EUR, GBP, JPY, CAD, AUD'
    }),

  region: Joi.string().optional().max(50)
    .messages({
      'string.max': 'Region cannot exceed 50 characters'
    })
});

const documentUploadSchema = Joi.object({
  llmProvider: Joi.string().valid('openai', 'claude', 'gemini', 'grok', 'deepseek').required()
    .messages({
      'any.only': 'LLM provider must be one of: openai, claude, gemini, grok, deepseek',
      'any.required': 'LLM provider is required'
    })
});

// Validation middleware functions
const validateBomRequest = (req, res, next) => {
  const { error, value } = bomRequestSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

const validateDocumentUpload = (req, res, next) => {
  const { error, value } = documentUploadSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }

  req.body = value;
  next();
};

// Sanitization helpers
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .replace(/javascript:/gi, '') // Remove JavaScript URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\x00/g, ''); // Remove null bytes
};

const sanitizeRequirements = (req, res, next) => {
  if (req.body.requirements) {
    req.body.requirements = sanitizeInput(req.body.requirements);
  }

  if (req.body.followUpAnswers && typeof req.body.followUpAnswers === 'object') {
    Object.keys(req.body.followUpAnswers).forEach(key => {
      if (typeof req.body.followUpAnswers[key] === 'string') {
        req.body.followUpAnswers[key] = sanitizeInput(req.body.followUpAnswers[key]);
      }
    });
  }

  next();
};

// Content validation
const validateContent = (content, maxLength = 50000) => {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content type');
  }

  if (content.length > maxLength) {
    throw new Error(`Content too long. Maximum length is ${maxLength} characters`);
  }

  // Check for suspicious content patterns
  const suspiciousPatterns = [
    /javascript:/gi,
    /<script/gi,
    /on\w+=/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
  
  if (hasSuspiciousContent) {
    throw new Error('Content contains potentially harmful patterns');
  }

  return true;
};

// File validation
const validateFileType = (file) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/bmp',
    'image/tiff'
  ];

  const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.bmp', '.tiff'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
  }

  // Additional file size validation
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB');
  }

  return true;
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  next();
};

module.exports = {
  validateBomRequest,
  validateDocumentUpload,
  sanitizeRequirements,
  validateContent,
  validateFileType,
  securityHeaders,
  sanitizeInput
};