import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 120000, // 2 minutes timeout for BOM generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login if needed
      localStorage.removeItem('authToken');
    } else if (error.response?.status === 429) {
      // Rate limit exceeded
      console.warn('Rate limit exceeded:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      error.message = 'Request timeout - please try again';
    }
    
    return Promise.reject(error);
  }
);

// API functions

/**
 * Get available LLM providers
 */
export const getLLMProviders = async () => {
  const response = await api.get('/llm-providers');
  return response.data;
};

/**
 * Generate BOM from requirements
 */
export const generateBOM = async (requestData) => {
  const response = await api.post('/generate-bom', requestData, {
    responseType: requestData.followUpAnswers ? 'json' : 'json', // Always use json initially to check response
  });
  
  // Always return JSON data - let the component handle blob conversion if needed
  return response.data;
};

/**
 * Upload and parse document
 */
export const uploadDocument = async (formData) => {
  const response = await api.post('/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 1 minute timeout for document processing
  });
  return response.data;
};

/**
 * Get OCI service categories
 */
export const getOCICategories = async () => {
  const response = await api.get('/oci-categories');
  return response.data;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Utility functions

/**
 * Download file from blob data
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type
 */
export const validateFileType = (file) => {
  const allowedTypes = [
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
  
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  return {
    isValid: allowedTypes.includes(file.type) && allowedExtensions.includes(fileExtension),
    allowedTypes: allowedExtensions
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries === maxRetries - 1 || error.response?.status < 500) {
        throw error;
      }
      
      const delay = Math.pow(2, retries) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
};

/**
 * Check if API is available
 */
export const checkAPIHealth = async () => {
  try {
    await healthCheck();
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;