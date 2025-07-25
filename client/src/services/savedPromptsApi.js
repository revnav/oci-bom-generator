import api from './api';

// Get all saved prompts
export const getSavedPrompts = async () => {
  const response = await api.get('/saved-prompts');
  return response.data;
};

// Get a specific saved prompt
export const getSavedPrompt = async (id) => {
  const response = await api.get(`/saved-prompts/${id}`);
  return response.data;
};

// Save a new prompt
export const savePrompt = async (promptData) => {
  const response = await api.post('/saved-prompts', promptData);
  return response.data;
};

// Update an existing prompt
export const updatePrompt = async (id, updates) => {
  const response = await api.put(`/saved-prompts/${id}`, updates);
  return response.data;
};

// Delete a saved prompt
export const deletePrompt = async (id) => {
  const response = await api.delete(`/saved-prompts/${id}`);
  return response.data;
};

// Mark a prompt as used (increment usage count)
export const usePrompt = async (id) => {
  const response = await api.post(`/saved-prompts/${id}/use`);
  return response.data;
};

// Get prompt suggestions
export const getPromptSuggestions = async (partialText) => {
  const response = await api.post('/saved-prompts/suggestions', { partialText });
  return response.data;
};