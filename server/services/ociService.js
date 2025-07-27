const axios = require('axios');

class OCIService {
  constructor() {
    this.baseURL = 'https://apexapps.oracle.com/pls/apex/cetools/api/v1/products/';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  async getServiceCategories() {
    try {
      const services = await this.getAllServices();
      const categories = [...new Set(services.map(service => service.serviceCategory))];
      return categories.filter(cat => cat && cat.trim());
    } catch (error) {
      console.error('Error fetching service categories:', error);
      throw new Error('Failed to fetch OCI service categories');
    }
  }

  async getAllServices() {
    const cacheKey = 'all_services';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get(this.baseURL, {
        timeout: 10000, // Reduced timeout to 10 seconds
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OCI-BOM-Generator/1.0'
        }
      });

      const services = response.data.items || response.data || [];
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: services,
        timestamp: Date.now()
      });

      return services;
    } catch (error) {
      console.warn('⚠️  OCI API unavailable, using fallback pricing data:', error.message);
      console.log('📋 Generating BOM with sample OCI services and pricing');
      return this.getFallbackServices();
    }
  }

  getFallbackServices() {
    // Fallback OCI services data for when the API is unavailable
    return [
      {
        partNumber: 'B88317',
        displayName: 'Compute - Standard - E4 - OCPU Hour',
        serviceCategory: 'Compute',
        skuType: 'OCPU',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'OCPU_HOUR',
          unitPrice: 0.0255
        }],
        metricName: 'OCPU_HOUR'
      },
      {
        partNumber: 'B88318',
        displayName: 'Compute - Standard - E4 - Memory GB Hour',
        serviceCategory: 'Compute',
        skuType: 'MEMORY',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'GB_HOUR',
          unitPrice: 0.00255
        }],
        metricName: 'GB_HOUR'
      },
      {
        partNumber: 'B91969',
        displayName: 'Load Balancer - Flexible - 10 Mbps',
        serviceCategory: 'Networking',
        skuType: 'LOAD_BALANCER',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'HOUR',
          unitPrice: 0.025
        }],
        metricName: 'HOUR'
      },
      {
        partNumber: 'B88514',
        displayName: 'Block Storage - Performance',
        serviceCategory: 'Storage',
        skuType: 'BLOCK_STORAGE',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'GB_MONTH',
          unitPrice: 0.0255
        }],
        metricName: 'GB_MONTH'
      },
      {
        partNumber: 'B89728',
        displayName: 'Database - Base Database Service - BYOL',
        serviceCategory: 'Database',
        skuType: 'DATABASE_BYOL',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'OCPU_HOUR',
          unitPrice: 0.255
        }],
        metricName: 'OCPU_HOUR'
      },
      {
        partNumber: 'B88319',
        displayName: 'Compute - Standard - E3 - OCPU Hour',
        serviceCategory: 'Compute',
        skuType: 'OCPU',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'OCPU_HOUR',
          unitPrice: 0.0306
        }],
        metricName: 'OCPU_HOUR'
      },
      {
        partNumber: 'B91968',
        displayName: 'Load Balancer - Flexible - 100 Mbps',
        serviceCategory: 'Networking',
        skuType: 'LOAD_BALANCER',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'HOUR',
          unitPrice: 0.25
        }],
        metricName: 'HOUR'
      },
      {
        partNumber: 'B88515',
        displayName: 'Block Storage - Balanced',
        serviceCategory: 'Storage',
        skuType: 'BLOCK_STORAGE',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'GB_MONTH',
          unitPrice: 0.0425
        }],
        metricName: 'GB_MONTH'
      },
      {
        partNumber: 'B89729',
        displayName: 'Database - Autonomous Database - OCPU Hour',
        serviceCategory: 'Database',
        skuType: 'DATABASE_AUTO',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'OCPU_HOUR',
          unitPrice: 0.72
        }],
        metricName: 'OCPU_HOUR'
      },
      {
        partNumber: 'B91234',
        displayName: 'Virtual Cloud Network - NAT Gateway',
        serviceCategory: 'Networking',
        skuType: 'NAT_GATEWAY',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'HOUR',
          unitPrice: 0.045
        }],
        metricName: 'HOUR'
      },
      {
        partNumber: 'B91235',
        displayName: 'Object Storage - Standard',
        serviceCategory: 'Storage',
        skuType: 'OBJECT_STORAGE',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'GB_MONTH',
          unitPrice: 0.0255
        }],
        metricName: 'GB_MONTH'
      },
      {
        partNumber: 'B91236',
        displayName: 'File Storage - Standard',
        serviceCategory: 'Storage',
        skuType: 'FILE_STORAGE',
        pricing: [{
          currency: 'USD',
          model: 'PAYG',
          unit: 'GB_MONTH',
          unitPrice: 0.085
        }],
        metricName: 'GB_MONTH'
      }
    ];
  }

  async findMatchingServices(requirements) {
    try {
      const allServices = await this.getAllServices();
      const matchedServices = [];

      // Service matching logic based on requirements
      const serviceKeywords = this.extractServiceKeywords(requirements);

      for (const service of allServices) {
        const relevanceScore = this.calculateRelevanceScore(service, serviceKeywords, requirements);
        
        if (relevanceScore > 0.1) { // Lowered threshold for relevance
          const extractedPricing = this.extractPricing(service);
          
          // For fallback services, use the embedded pricing directly
          let finalPricing = extractedPricing && Object.keys(extractedPricing).length > 0 
            ? extractedPricing 
            : (service.pricing && service.pricing.length > 0 ? service.pricing[0] : null);
          
          // Normalize pricing format - ensure unitPrice field exists
          if (finalPricing && !finalPricing.unitPrice && finalPricing.price !== undefined) {
            finalPricing.unitPrice = finalPricing.price;
          }
          if (finalPricing && !finalPricing.unit && service.metricName) {
            finalPricing.unit = service.metricName;
          }
          
          if (finalPricing) {
            matchedServices.push({
              ...service,
              relevanceScore,
              pricing: finalPricing
            });
          }
        }
      }

      // Sort by relevance score
      matchedServices.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // If no services matched, ensure we have at least basic services available
      if (matchedServices.length === 0) {
        console.warn('⚠️ No services matched requirements, returning all fallback services');
        return allServices.slice(0, 15).map(service => {
          let pricing = service.pricing && service.pricing.length > 0 ? service.pricing[0] : null;
          
          // Ensure unitPrice field exists for consistency
          if (pricing && !pricing.unitPrice && pricing.price !== undefined) {
            pricing = { ...pricing, unitPrice: pricing.price };
          }
          
          return {
            partNumber: service.partNumber,
            displayName: service.displayName,
            serviceCategory: service.serviceCategory,
            skuType: service.skuType,
            pricing: pricing,
            relevanceScore: 0.5,
            metricName: service.metricName
          };
        }).filter(s => s.pricing && (s.pricing.unitPrice !== undefined || s.pricing.price !== undefined)); // Only include services with pricing
      }
      
      // Return top 20 matches with only essential data to reduce token usage
      return matchedServices.slice(0, 20).map(service => ({
        partNumber: service.partNumber,
        displayName: service.displayName,
        serviceCategory: service.serviceCategory,
        skuType: service.skuType,
        pricing: service.pricing,
        relevanceScore: service.relevanceScore,
        metricName: service.metricName
      }));
    } catch (error) {
      console.error('Error finding matching services:', error);
      throw new Error('Failed to find matching OCI services');
    }
  }

  extractServiceKeywords(requirements) {
    const keywords = {
      compute: ['compute', 'server', 'instance', 'vm', 'cpu', 'processor', 'core'],
      storage: ['storage', 'disk', 'block', 'object', 'file', 'backup', 'archive'],
      database: ['database', 'db', 'mysql', 'postgresql', 'oracle', 'mongodb', 'sql'],
      network: ['network', 'vpc', 'load balancer', 'cdn', 'dns', 'bandwidth', 'traffic'],
      security: ['security', 'firewall', 'waf', 'identity', 'access', 'encryption'],
      analytics: ['analytics', 'data', 'warehouse', 'etl', 'bi', 'reporting'],
      ai: ['ai', 'machine learning', 'ml', 'artificial intelligence', 'generative'],
      container: ['container', 'kubernetes', 'docker', 'k8s', 'orchestration'],
      monitoring: ['monitoring', 'logging', 'observability', 'metrics', 'alerts']
    };

    const text = JSON.stringify(requirements).toLowerCase();
    const foundKeywords = {};

    Object.keys(keywords).forEach(category => {
      foundKeywords[category] = keywords[category].filter(keyword => 
        text.includes(keyword)
      ).length;
    });

    return foundKeywords;
  }

  calculateRelevanceScore(service, serviceKeywords, requirements) {
    let score = 0;
    const serviceText = `${service.displayName} ${service.serviceCategory}`.toLowerCase();

    // Category matching
    Object.keys(serviceKeywords).forEach(category => {
      if (serviceKeywords[category] > 0) {
        if (serviceText.includes(category)) {
          score += serviceKeywords[category] * 0.3;
        }
      }
    });

    // Direct keyword matching in service name/description
    const reqText = JSON.stringify(requirements).toLowerCase();
    const words = reqText.split(/\s+/);
    
    words.forEach(word => {
      if (word.length > 3 && serviceText.includes(word)) {
        score += 0.1;
      }
    });

    // Service category boost
    const categoryBoosts = {
      'compute': 0.8,
      'storage': 0.7,
      'database': 0.9,
      'network': 0.6,
      'security': 0.7,
      'analytics': 0.5,
      'ai': 0.6
    };

    Object.keys(categoryBoosts).forEach(cat => {
      if (serviceText.includes(cat)) {
        score += categoryBoosts[cat];
      }
    });

    return Math.min(score, 1.0); // Cap at 1.0
  }

  extractPricing(service) {
    const pricing = {};
    
    if (service.currencyCodeLocalizations) {
      // Extract USD pricing by default
      const usdPricing = service.currencyCodeLocalizations.find(curr => curr.currencyCode === 'USD');
      
      if (usdPricing) {
        pricing.currency = 'USD';
        pricing.price = parseFloat(usdPricing.price) || 0;
        pricing.model = usdPricing.model || 'PAY_AS_YOU_GO';
      }

      // Also provide other currencies
      pricing.allCurrencies = service.currencyCodeLocalizations.map(curr => ({
        code: curr.currencyCode,
        price: parseFloat(curr.price) || 0,
        model: curr.model
      }));
    }

    return pricing;
  }

  async getServiceDetails(partNumber) {
    try {
      const allServices = await this.getAllServices();
      return allServices.find(service => service.partNumber === partNumber);
    } catch (error) {
      console.error('Error getting service details:', error);
      throw new Error('Failed to get service details');
    }
  }

  // Utility method to search services by category
  async getServicesByCategory(category) {
    try {
      const allServices = await this.getAllServices();
      return allServices.filter(service => 
        service.serviceCategory && 
        service.serviceCategory.toLowerCase().includes(category.toLowerCase())
      );
    } catch (error) {
      console.error('Error getting services by category:', error);
      throw new Error('Failed to get services by category');
    }
  }

  // Method to get pricing for specific regions/currencies
  async getPricingForCurrency(partNumber, currencyCode = 'USD') {
    try {
      const service = await this.getServiceDetails(partNumber);
      
      if (!service || !service.currencyCodeLocalizations) {
        return null;
      }

      const pricing = service.currencyCodeLocalizations.find(
        curr => curr.currencyCode === currencyCode
      );

      return pricing ? {
        partNumber: service.partNumber,
        displayName: service.displayName,
        currency: currencyCode,
        price: parseFloat(pricing.price) || 0,
        model: pricing.model,
        metricName: service.metricName
      } : null;
    } catch (error) {
      console.error('Error getting pricing for currency:', error);
      throw new Error('Failed to get pricing information');
    }
  }
}

module.exports = new OCIService();