const fs = require('fs').promises;
const path = require('path');

class SavedPromptsService {
  constructor() {
    this.dataFile = path.join(__dirname, '../data/saved-prompts.json');
    this.ensureDataFile();
  }

  async ensureDataFile() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.dataFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Create file if it doesn't exist
      try {
        await fs.access(this.dataFile);
      } catch {
        await fs.writeFile(this.dataFile, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error ensuring data file:', error);
    }
  }

  async getAllPrompts() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      const prompts = JSON.parse(data);
      // Sort by last used date, then by creation date
      return prompts.sort((a, b) => {
        const aDate = new Date(a.lastUsed || a.createdAt);
        const bDate = new Date(b.lastUsed || b.createdAt);
        return bDate - aDate;
      });
    } catch (error) {
      console.error('Error reading saved prompts:', error);
      return [];
    }
  }

  async getPromptById(id) {
    const prompts = await this.getAllPrompts();
    return prompts.find(p => p.id === id);
  }

  async savePrompt(promptData) {
    try {
      const prompts = await this.getAllPrompts();
      
      // Generate unique ID
      const id = this.generateId();
      
      // Auto-generate name if not provided
      const name = promptData.name || this.generatePromptName(promptData.requirements);
      
      // Auto-categorize
      const category = this.categorizePrompt(promptData.requirements, promptData.followUpAnswers);
      
      // Generate description
      const description = this.generateDescription(promptData.requirements, promptData.followUpAnswers);
      
      // Extract tags
      const tags = this.extractTags(promptData.requirements, promptData.followUpAnswers);

      const savedPrompt = {
        id,
        name,
        description,
        category,
        requirements: promptData.requirements,
        followUpAnswers: promptData.followUpAnswers || {},
        llmProvider: promptData.llmProvider,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 1,
        tags
      };

      prompts.push(savedPrompt);
      await fs.writeFile(this.dataFile, JSON.stringify(prompts, null, 2));
      
      console.log(`💾 Saved new prompt: "${name}"`);
      return savedPrompt;
    } catch (error) {
      console.error('Error saving prompt:', error);
      throw error;
    }
  }

  async updatePrompt(id, updates) {
    try {
      const prompts = await this.getAllPrompts();
      const index = prompts.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error('Prompt not found');
      }

      // Update the prompt
      prompts[index] = {
        ...prompts[index],
        ...updates,
        lastUsed: new Date().toISOString(),
        usageCount: (prompts[index].usageCount || 0) + 1
      };

      await fs.writeFile(this.dataFile, JSON.stringify(prompts, null, 2));
      return prompts[index];
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }

  async incrementUsage(id) {
    try {
      const prompts = await this.getAllPrompts();
      const index = prompts.findIndex(p => p.id === id);
      
      if (index !== -1) {
        prompts[index].lastUsed = new Date().toISOString();
        prompts[index].usageCount = (prompts[index].usageCount || 0) + 1;
        await fs.writeFile(this.dataFile, JSON.stringify(prompts, null, 2));
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }

  async deletePrompt(id) {
    try {
      const prompts = await this.getAllPrompts();
      const filteredPrompts = prompts.filter(p => p.id !== id);
      await fs.writeFile(this.dataFile, JSON.stringify(filteredPrompts, null, 2));
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }

  generateId() {
    return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generatePromptName(requirements) {
    const words = requirements.toLowerCase().split(/\s+/);
    const keywords = [
      'web application', 'database', 'api', 'microservices', 'e-commerce', 
      'analytics', 'mobile app', 'data warehouse', 'ml', 'ai', 'blockchain',
      'ebs', 'erp', 'crm', 'cms', 'blog', 'portal', 'dashboard'
    ];

    // Find relevant keywords
    let foundKeywords = [];
    for (const keyword of keywords) {
      if (requirements.toLowerCase().includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }

    if (foundKeywords.length > 0) {
      return `BOM for ${foundKeywords[0].replace(/\b\w/g, l => l.toUpperCase())} System`;
    }

    // Fallback to first few words
    const firstWords = words.slice(0, 4).join(' ');
    return `BOM for ${firstWords.replace(/\b\w/g, l => l.toUpperCase())}`;
  }

  categorizePrompt(requirements, followUpAnswers = {}) {
    const text = (requirements + ' ' + Object.values(followUpAnswers).join(' ')).toLowerCase();

    const categories = {
      'Web Applications': ['web', 'website', 'portal', 'frontend', 'backend', 'api', 'rest'],
      'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'payment', 'cart', 'product'],
      'Enterprise Applications': ['erp', 'crm', 'ebs', 'enterprise', 'business', 'workflow'],
      'Data & Analytics': ['data', 'analytics', 'warehouse', 'etl', 'bi', 'reporting', 'dashboard'],
      'AI & Machine Learning': ['ai', 'ml', 'machine learning', 'neural', 'model', 'training'],
      'Mobile Applications': ['mobile', 'ios', 'android', 'app store', 'react native'],
      'Infrastructure': ['infrastructure', 'server', 'compute', 'storage', 'network', 'load balancer'],
      'Database Systems': ['database', 'mysql', 'postgresql', 'oracle', 'mongodb', 'redis'],
      'Content Management': ['cms', 'blog', 'content', 'publishing', 'media', 'document'],
      'IoT & Edge': ['iot', 'edge', 'sensor', 'device', 'embedded', 'real-time']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'General Applications';
  }

  generateDescription(requirements, followUpAnswers = {}) {
    // Extract key requirements for description
    const text = requirements.toLowerCase();
    const answers = Object.values(followUpAnswers);
    
    let desc = requirements.substring(0, 100);
    if (requirements.length > 100) {
      desc += '...';
    }

    // Add key technical details from follow-up answers
    const technicalDetails = [];
    answers.forEach(answer => {
      if (typeof answer === 'string') {
        if (answer.toLowerCase().includes('user') || answer.toLowerCase().includes('concurrent')) {
          technicalDetails.push(`Users: ${answer.substring(0, 50)}`);
        } else if (answer.toLowerCase().includes('gb') || answer.toLowerCase().includes('cpu')) {
          technicalDetails.push(`Specs: ${answer.substring(0, 50)}`);
        }
      }
    });

    if (technicalDetails.length > 0) {
      desc += ` | ${technicalDetails.join(' | ')}`;
    }

    return desc;
  }

  extractTags(requirements, followUpAnswers = {}) {
    const text = (requirements + ' ' + Object.values(followUpAnswers).join(' ')).toLowerCase();
    const tags = [];

    const tagKeywords = {
      'high-availability': ['high availability', 'ha', '99.9', 'uptime', 'failover'],
      'scalable': ['scale', 'scalable', 'elastic', 'auto-scaling', 'growth'],
      'secure': ['security', 'secure', 'encryption', 'ssl', 'authentication'],
      'cloud-native': ['cloud', 'kubernetes', 'container', 'microservices'],
      'real-time': ['real-time', 'real time', 'streaming', 'instant', 'live'],
      'global': ['global', 'worldwide', 'multi-region', 'international'],
      'backup': ['backup', 'disaster recovery', 'dr', 'snapshot'],
      'monitoring': ['monitoring', 'logging', 'observability', 'metrics']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 5); // Limit to 5 tags
  }

  async getPromptSuggestions(partialText) {
    const prompts = await this.getAllPrompts();
    const suggestions = [];

    // Get frequently used phrases from existing prompts
    const commonPhrases = [];
    prompts.forEach(prompt => {
      const words = prompt.requirements.split(/\s+/);
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
        commonPhrases.push(phrase);
      }
    });

    // Count phrase frequency
    const phraseCount = {};
    commonPhrases.forEach(phrase => {
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    });

    // Get top phrases
    const topPhrases = Object.entries(phraseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([phrase]) => phrase);

    return topPhrases.filter(phrase => 
      phrase.includes(partialText.toLowerCase()) || 
      partialText.toLowerCase().includes(phrase)
    );
  }
}

module.exports = new SavedPromptsService();