import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  BookmarkIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ClockIcon,
  TagIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { getSavedPrompts, deletePrompt, usePrompt } from '../services/savedPromptsApi';
import PromptCard from './PromptCard';
import LoadingSpinner from './LoadingSpinner';

const SavedPrompts = ({ onUsePrompt, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('lastUsed'); // lastUsed, created, usage, name

  const queryClient = useQueryClient();

  // Fetch saved prompts
  const { data: promptsData, isLoading, error } = useQuery(
    'saved-prompts',
    getSavedPrompts,
    {
      staleTime: 30 * 1000, // 30 seconds
      onError: (error) => {
        toast.error('Failed to load saved prompts');
        console.error('Error loading saved prompts:', error);
      }
    }
  );

  // Delete prompt mutation
  const deleteMutation = useMutation(deletePrompt, {
    onSuccess: () => {
      queryClient.invalidateQueries('saved-prompts');
      toast.success('Prompt deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete prompt');
      console.error('Error deleting prompt:', error);
    }
  });

  // Use prompt mutation
  const usePromptMutation = useMutation(usePrompt, {
    onSuccess: () => {
      queryClient.invalidateQueries('saved-prompts');
    }
  });

  const prompts = promptsData?.prompts || [];

  // Get unique categories and tags
  const categories = ['All', ...new Set(prompts.map(p => p.category))];
  const allTags = [...new Set(prompts.flatMap(p => p.tags || []))];

  // Filter and sort prompts
  const filteredPrompts = prompts
    .filter(prompt => {
      const matchesSearch = searchQuery === '' || 
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.requirements.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => prompt.tags?.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastUsed':
          return new Date(b.lastUsed || b.createdAt) - new Date(a.lastUsed || a.createdAt);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleUsePrompt = async (prompt) => {
    try {
      // Increment usage count
      await useMutation.mutateAsync(prompt.id);
      
      // Pass prompt data to parent component
      onUsePrompt({
        requirements: prompt.requirements,
        followUpAnswers: prompt.followUpAnswers || {},
        llmProvider: prompt.llmProvider,
        promptId: prompt.id,
        promptName: prompt.name
      });
      
      toast.success(`Using prompt: ${prompt.name}`);
    } catch (error) {
      console.error('Error using prompt:', error);
      toast.error('Failed to use prompt');
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      deleteMutation.mutate(promptId);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading saved prompts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">Failed to load saved prompts</div>
        <button 
          onClick={() => queryClient.invalidateQueries('saved-prompts')}
          className="text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookmarkIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Saved Prompts</h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {prompts.length}
          </span>
        </div>
        
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create New BOM</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts by name, description, or requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FolderIcon className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lastUsed">Recently Used</option>
              <option value="created">Newest First</option>
              <option value="usage">Most Used</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="w-4 h-4 inline mr-1" />
              Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredPrompts.length} of {prompts.length} prompts
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <BookmarkIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {prompts.length === 0 ? 'No saved prompts yet' : 'No prompts match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {prompts.length === 0 
              ? 'Create your first BOM to automatically save prompts for future use'
              : 'Try adjusting your search criteria or filters'
            }
          </p>
          {prompts.length === 0 && (
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First BOM
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onUse={() => handleUsePrompt(prompt)}
              onDelete={() => handleDeletePrompt(prompt.id)}
              isDeleting={deleteMutation.isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPrompts;