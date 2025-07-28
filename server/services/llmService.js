const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const constraintValidator = require('./constraintValidatorRedesigned');

class LLMService {
  constructor() {
    // Initialize LLM clients
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Universal instruction detection patterns - works with ANY constraint type
    this.instructionPatterns = {
      restrictive: [
        // "only" patterns - captures the specific requirement
        /only\s+(consider|use|include|allow)\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /exclusively\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /specifically\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /solely\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        // "must" patterns - captures mandatory requirements
        /must\s+(be|use|include|have)\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /required\s*:?\s*([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /constraint\s*:?\s*([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /limitation\s*:?\s*([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        // "should" patterns - captures preferences with constraint weight
        /should\s+(only|exclusively)?\s*([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        // Generic "X only" patterns
        /([a-zA-Z\s]+)\s+only(?=\.|\n|!|\?|;|$)/gi
      ],
      scope: [
        // "do not" patterns - captures what to exclude
        /do\s+not\s+(include|add|consider|use|allow)\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /don['’]?t\s+(include|add|consider|use|allow)\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        // "exclude" patterns
        /exclude\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /avoid\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        /not\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
        // "no" patterns - captures negative constraints
        /no\s+([a-zA-Z][^\n\.!?;]*?)(?=\.|\n|!|\?|;|$)/gi,
        // "without" patterns
        /without\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi
      ],
      specific_sku: [
        // SKU/Part number patterns - more precise matching
        /(?:sku|part\s*number|service\s*code|product\s*code)\s*:?\s*([A-Za-z]\d+[A-Za-z0-9\-_]*)/gi,
        /\b([A-Z]\d{5,})\b/gi, // Pattern like B88317, B109356
        /model\s*:?\s*([A-Za-z0-9\-_]{4,})/gi
      ]
    };

    // System prompts for different tasks
    this.systemPrompts = {
      requirementAnalysis: `You are an Oracle Cloud Infrastructure (OCI) expert and solutions architect. 
      
      CRITICAL INSTRUCTION HANDLING RULES:
      1. ALWAYS scan for and identify specific user instructions, constraints, and limitations
      2. Treat explicit user instructions as MANDATORY constraints, not suggestions
      3. Never override or expand beyond specific user requirements
      4. If user specifies "only X" or "exclusively Y", focus ONLY on that scope
      5. Extract and preserve exact SKU/service specifications when provided
      
      Analyze the provided requirements and extract specific infrastructure needs including:
      - Compute requirements (CPU, RAM, instances)
      - Storage needs (block, object, file storage)
      - Network requirements (bandwidth, load balancers)
      - Database services needed
      - Security requirements
      - Backup and disaster recovery needs
      - Regional/availability zone preferences
      - SPECIFIC CONSTRAINTS and LIMITATIONS provided by user
      
      SMART ANALYSIS RULES:
      1. If specific numbers are provided (e.g., "4 cores", "16 GB RAM", "100 GB storage"), use them directly
      2. If document content contains structured data, prioritize that over asking follow-up questions
      3. Only ask follow-up questions for truly missing critical information
      4. Look for patterns like "2 servers with 4 cores each" and calculate total requirements
      5. IDENTIFY and EXTRACT specific instructions like "only consider", "exclusively use", "must be", "do not include"
      
      If information is missing or unclear, identify specific follow-up questions to ask.
      
      IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or anything other than the JSON object. Start your response with { and end with }. Required format: {"parsedRequirements": {...}, "userConstraints": [...], "needsFollowUp": boolean, "followUpQuestions": [...]}`,

      bomGeneration: `You are creating a detailed Bill of Materials (BOM) for Oracle Cloud Infrastructure services.
      
      🎯 UNIVERSAL USER CONSTRAINT ENFORCEMENT 🎯
      
      CORE PRINCIPLE: User constraints are ABSOLUTE requirements that override all other considerations.
      
      UNIVERSAL CONSTRAINT HANDLING:
      1. If user specifies "only consider X" → Include ONLY services that match X criteria
      2. If user specifies "do not consider Y" → Exclude ALL services that match Y criteria  
      3. If user provides specific SKUs → Use ONLY those exact SKUs
      4. User constraints apply to ANY service type (database, compute, storage, network, etc.)
      
      CONSTRAINT INTERPRETATION EXAMPLES:
      - "only consider Exascale" → Include ONLY Exascale services, reject Base Database
      - "only consider Base Database" → Include ONLY Base Database, reject Exascale
      - "only consider MySQL" → Include ONLY MySQL services, reject Oracle Database
      - "do not consider compute" → Reject ALL compute/VM/instance services
      - "BYOL only" → Include ONLY BYOL services, reject license-included
      
      BIDIRECTIONAL CONSTRAINT SUPPORT:
      - Constraints work in ANY direction based on user intent
      - No hardcoded exclusions - let user define what they want/don't want
      - Support for ANY technology stack, service type, or provider model
      
      CONSTRAINT COMPLIANCE DOCUMENTATION:
      - For each BOM item, document WHY it meets user constraints
      - If LLM includes items that seem to violate constraints, provide detailed justification
      - Be transparent about constraint interpretation and decision-making
      
      MANDATORY PROCESS:
      1. Analyze user constraints carefully
      2. Interpret constraints based on user intent (not hardcoded rules)
      3. Select services that match user criteria
      4. Document constraint compliance for each item
      5. If unsure about constraint interpretation, err on the side of user preference
      
      CRITICAL CALCULATION RULES:
      1. Respect Oracle-specific sizing ratios (e.g., ECPUs vs cores)
      2. Use appropriate service metrics and units as defined by Oracle
      3. Calculate realistic quantities based on actual requirements
      4. When user specifies cores, convert to appropriate service units (OCPU, ECPU, etc.)
      5. Ensure quantities align with service-specific measurement units
      
      Based on the analyzed requirements, user constraints, and available OCI services with pricing, create a targeted BOM.
      
      UNIVERSAL CONSTRAINT VALIDATION:
      - ALWAYS validate each service against ALL user constraints before inclusion
      - If user specifies "only X", include ONLY services that match X criteria
      - If user excludes "Y", do NOT include any services containing Y characteristics
      - Match constraints using keyword analysis - service names, categories, SKU types must align with user requirements
      - When in doubt, be MORE restrictive rather than adding unwanted services
      - Document why each service was included/excluded based on specific constraint keywords
      
      CRITICAL QUANTITY RULES:
      - For HOURLY services (OCPU_HOUR, MEMORY_GB_HOUR): quantity = number of resources (e.g., 4 OCPUs, 8 GB RAM)
      - For MONTHLY services (STORAGE_GB, BANDWIDTH_GB): quantity = total amount per month (e.g., 100 GB storage)
      - DO NOT multiply hourly quantities by hours - the Excel will handle time calculations
      - Example: For 2 servers with 2 OCPUs each running 24/7, quantity = 4 (not 4 × 744)
      
      IMPORTANT: Return JSON in this EXACT format:
      {
        "items": [
          {
            "sku": "B88317",
            "partNumber": "B88317", 
            "description": "Compute - Standard - E4 - OCPU Hour",
            "displayName": "Compute - Standard - E4 - OCPU Hour",
            "quantity": 4,
            "metric": "OCPU_HOUR",
            "metricName": "OCPU Hour",
            "unitPrice": 0.0255,
            "category": "Compute",
            "serviceCategory": "Compute",
            "notes": "2 application servers × 2 OCPUs each"
          },
          {
            "sku": "B85729",
            "partNumber": "B85729",
            "description": "Block Volume Storage",
            "displayName": "Block Volume Storage", 
            "quantity": 200,
            "metric": "STORAGE_GB_MONTH",
            "metricName": "GB per Month",
            "unitPrice": 0.0255,
            "category": "Storage",
            "serviceCategory": "Storage",
            "notes": "100 GB per server × 2 servers"
          }
        ]
      }
      
      Calculate realistic quantities based on requirements. Use the provided OCI services and their exact part numbers and pricing.
      
      CRITICAL JSON FORMATTING RULES:
      - Respond with ONLY valid JSON - no explanatory text, markdown, or code blocks
      - Start response with { and end with }
      - Use double quotes for all strings, never single quotes
      - No trailing commas after the last property
      - In "notes" field: Use only alphanumeric characters, spaces, hyphens, periods, and commas
      - NEVER use single quotes (') or unescaped double quotes (") within string values
      - Replace problematic characters: single quote → hyphen, double quote → hyphen
      - Keep notes simple and avoid complex punctuation or nested quotes
      - Escape special characters in strings (\\n for newlines, \\" for quotes)
      - Numbers should not be quoted
      - Boolean values should be true/false (not quoted)
      
      EXAMPLE GOOD NOTES:
      "Database service for 100 users with standard performance"
      "Block storage supporting the database instance"
      "Cost-optimized choice for customer requirements"
      
      EXAMPLE BAD NOTES (DO NOT USE):
      "Service for user's 'special' requirements"
      "Matches customer's \"only database\" constraint"
      "Supports 'BYOL' licensing model"`
    };
  }

  // Extract customer constraints using redesigned constraint validator
  extractUserConstraints(requirementsText) {
    console.log('🔍 Extracting customer constraints using redesigned validator...');
    const constraints = constraintValidator.extractCustomerConstraints(requirementsText);
    console.log('📋 Extracted constraints:', JSON.stringify(constraints, null, 2));
    return constraints;
  }

  // Universal constraint compliance analysis - works for ANY constraint type
  analyzeItemConstraintCompliance(item, userConstraints) {
    const itemText = `${item.description || ''} ${item.displayName || ''} ${item.sku || ''}`;
    const analysis = {
      compliant: true,
      reasons: [],
      warnings: []
    };

    if (!userConstraints || Object.keys(userConstraints).length === 0) {
      analysis.reasons.push('No user constraints specified');
      return analysis;
    }

    // Document which constraints this item satisfies/violates
    if (userConstraints.restrictive?.length > 0) {
      userConstraints.restrictive.forEach(restriction => {
        analysis.reasons.push(`Restrictive constraint: "${restriction.instruction}" - Item: ${itemText}`);
      });
    }

    if (userConstraints.exclusions?.length > 0) {
      userConstraints.exclusions.forEach(exclusion => {
        analysis.reasons.push(`Exclusion constraint: "${exclusion.instruction}" - Item: ${itemText}`);
      });
    }

    if (userConstraints.specificSkus?.length > 0) {
      const allowedSkus = userConstraints.specificSkus.map(s => s.sku);
      const itemSku = item.sku || item.partNumber;
      if (allowedSkus.includes(itemSku)) {
        analysis.reasons.push(`SKU constraint satisfied: ${itemSku} is in allowed list`);
      } else {
        analysis.compliant = false;
        analysis.warnings.push(`SKU constraint violation: ${itemSku} not in allowed list: ${allowedSkus.join(', ')}`);
      }
    }

    return analysis;
  }

  // Extract meaningful keywords from constraint instructions
  extractKeywords(instruction) {
    const text = instruction.toLowerCase();
    const keywords = [];
    
    // Common stop words to ignore
    const stopWords = ['only', 'consider', 'do', 'not', 'include', 'use', 'with', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'as', 'by'];
    
    // Split into words and filter
    const words = text.split(/\s+/).filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) &&
      !/^\d+$/.test(word) // exclude pure numbers
    );
    
    // Also extract meaningful phrases
    const phrases = [];
    if (text.includes('base database')) phrases.push('base database');
    if (text.includes('app server')) phrases.push('app server');
    if (text.includes('exascale')) phrases.push('exascale');
    if (text.includes('exadata')) phrases.push('exadata');
    if (text.includes('autonomous')) phrases.push('autonomous');
    if (text.includes('mysql')) phrases.push('mysql');
    if (text.includes('byol')) phrases.push('byol');
    if (text.includes('compute')) phrases.push('compute');
    
    return [...new Set([...words, ...phrases])];
  }

  // Generate human-readable constraint interpretation for LLM
  generateConstraintInterpretation(userConstraints) {
    const interpretations = [];
    
    if (userConstraints.restrictive?.length > 0) {
      userConstraints.restrictive.forEach(restriction => {
        const keywords = this.extractKeywords(restriction.instruction);
        interpretations.push(`RESTRICTIVE: "${restriction.instruction}" → Only include services matching: ${keywords.join(', ')}`);
      });
    }
    
    if (userConstraints.exclusions?.length > 0) {
      userConstraints.exclusions.forEach(exclusion => {
        const keywords = this.extractKeywords(exclusion.instruction);
        interpretations.push(`EXCLUSION: "${exclusion.instruction}" → Exclude services matching: ${keywords.join(', ')}`);
      });
    }
    
    if (userConstraints.specificSkus?.length > 0) {
      const skus = userConstraints.specificSkus.map(s => s.sku);
      interpretations.push(`SKU RESTRICTION: Only use these specific SKUs: ${skus.join(', ')}`);
    }
    
    return interpretations.join('\n');
  }

  // Universal service validation - works with ANY type of constraint
  validateServiceAgainstConstraints(service, constraints, requirements) {
    const serviceName = service.displayName?.toLowerCase() || '';
    const serviceCategory = service.serviceCategory?.toLowerCase() || '';
    const partNumber = service.partNumber?.toLowerCase() || '';
    const skuType = service.skuType?.toLowerCase() || '';
    
    const fullServiceText = `${serviceName} ${serviceCategory} ${partNumber} ${skuType}`.toLowerCase();
    
    // Universal exclusion checking - match any exclusion keywords
    if (constraints.exclusions?.length > 0) {
      for (const exclusion of constraints.exclusions) {
        const exclusionKeywords = this.extractKeywords(exclusion.instruction);
        
        for (const keyword of exclusionKeywords) {
          if (fullServiceText.includes(keyword.toLowerCase())) {
            return {
              allowed: false,
              reason: `Service excluded: matches exclusion keyword '${keyword}' from constraint '${exclusion.instruction}'`
            };
          }
        }
      }
    }
    
    // Universal restrictive checking - must match restriction keywords
    if (constraints.restrictive?.length > 0) {
      let matchesAnyRestriction = false;
      const matchDetails = [];
      
      for (const restriction of constraints.restrictive) {
        const restrictionKeywords = this.extractKeywords(restriction.instruction);
        let matchesThisRestriction = false;
        
        for (const keyword of restrictionKeywords) {
          if (fullServiceText.includes(keyword.toLowerCase())) {
            matchesThisRestriction = true;
            matchDetails.push(`matches '${keyword}' from '${restriction.instruction}'`);
            break;
          }
        }
        
        if (matchesThisRestriction) {
          matchesAnyRestriction = true;
        }
      }
      
      if (!matchesAnyRestriction) {
        return {
          allowed: false,
          reason: `Service doesn't match any restrictive constraints: ${constraints.restrictive.map(r => r.instruction).join('; ')}`
        };
      } else {
        return {
          allowed: true,
          reason: `Service matches constraints: ${matchDetails.join('; ')}`
        };
      }
    }
    
    // If specific SKUs are required, only allow those
    if (constraints.specificSkus?.length > 0) {
      const allowedSkus = constraints.specificSkus.map(s => s.sku.toLowerCase());
      if (!allowedSkus.includes(partNumber)) {
        return {
          allowed: false,
          reason: `Service ${service.partNumber} not in allowed SKUs: ${allowedSkus.join(', ')}`
        };
      }
    }

    // Check exclusions - flexible text matching with stop words filter
    for (const exclusion of constraints.exclusions) {
      const excludeText = exclusion.instruction.toLowerCase();
      
      // Split exclusion text into meaningful keywords (filter out common words)
      const stopWords = ['and', 'or', 'the', 'for', 'with', 'all', 'any', 'use', 'only', 'services'];
      const excludeKeywords = excludeText.split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
      
      // Check if any meaningful exclusion keywords match service properties
      for (const keyword of excludeKeywords) {
        if (serviceName.includes(keyword) || 
            serviceCategory.includes(keyword) || 
            partNumber.includes(keyword) ||
            skuType.includes(keyword)) {
          return {
            allowed: false,
            reason: `Service excluded by constraint '${exclusion.fullMatch}' - matched keyword '${keyword}'`
          };
        }
      }
    }

    // Check restrictive constraints - flexible matching
    if (constraints.restrictive.length > 0) {
      let matchesRestriction = false;
      let matchDetails = [];
      
      for (const restriction of constraints.restrictive) {
        const restrictText = restriction.instruction.toLowerCase();
        
        // Split restriction into meaningful keywords (filter out common words)
        const stopWords = ['and', 'or', 'the', 'for', 'with', 'all', 'any', 'use', 'only', 'services', 'consider', 'include'];
        const restrictKeywords = restrictText.split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.includes(word));
        
        // Skip if no meaningful keywords found
        if (restrictKeywords.length === 0) continue;
        
        // Check how many meaningful keywords match
        let matchCount = 0;
        let matchedKeywords = [];
        
        for (const keyword of restrictKeywords) {
          if (serviceName.includes(keyword) || 
              serviceCategory.includes(keyword) || 
              partNumber.includes(keyword) ||
              skuType.includes(keyword)) {
            matchCount++;
            matchedKeywords.push(keyword);
          }
        }
        
        // Service matches if it contains significant portion of meaningful constraint keywords
        const matchRatio = matchCount / restrictKeywords.length;
        if (matchRatio >= 0.4 || matchCount >= 2) { // At least 40% keywords match OR 2+ keywords
          matchesRestriction = true;
          matchDetails.push(`Matched ${matchCount}/${restrictKeywords.length} keywords from '${restriction.fullMatch}': [${matchedKeywords.join(', ')}]`);
          break;
        }
      }
      
      if (!matchesRestriction) {
        return {
          allowed: false,
          reason: `Service doesn't match restrictive constraints: ${constraints.restrictive.map(r => r.fullMatch).join('; ')}`
        };
      } else {
        return {
          allowed: true,
          reason: `Service matches constraints: ${matchDetails.join('; ')}`
        };
      }
    }

    return { allowed: true, reason: 'Service meets all constraints' };
  }

  async analyzeRequirements(requirements, provider, followUpAnswers = null) {
    if (followUpAnswers && Object.keys(followUpAnswers).length > 0) {
      // When follow-up answers are provided, create a comprehensive analysis
      const answersText = Object.entries(followUpAnswers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
        
      // Extract user constraints from original requirements
      const userConstraints = this.extractUserConstraints(requirements);
      
      const prompt = `Original requirements: ${requirements}

Follow-up answers provided:
${answersText}

Detected User Constraints:
${JSON.stringify(userConstraints, null, 2)}

Based on the original requirements and these follow-up answers, provide a complete infrastructure analysis. All necessary information has been provided, so do not request any additional follow-up questions. IMPORTANT: Preserve and include the detected user constraints in your response.`;
      
      const systemPrompt = `You are an Oracle Cloud Infrastructure (OCI) expert and solutions architect. 
      
      CRITICAL INSTRUCTION HANDLING RULES:
      1. ALWAYS preserve and respect user constraints and limitations
      2. Treat explicit user instructions as MANDATORY constraints, not suggestions
      3. Never override or expand beyond specific user requirements
      4. If user specifies "only X" or "exclusively Y", focus ONLY on that scope
      
      Analyze the provided requirements and follow-up answers to extract complete infrastructure needs including:
      - Compute requirements (CPU, RAM, instances)
      - Storage needs (block, object, file storage)
      - Network requirements (bandwidth, load balancers)
      - Database services needed
      - Security requirements
      - Backup and disaster recovery needs
      - Regional/availability zone preferences
      - USER CONSTRAINTS and LIMITATIONS (preserve exactly as detected)
      
      IMPORTANT: Since follow-up questions have already been answered, set needsFollowUp to false and provide empty followUpQuestions array.
      
      IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or anything other than the JSON object. Start your response with { and end with }. Required format: {"parsedRequirements": {...}, "userConstraints": {...}, "needsFollowUp": false, "followUpQuestions": []}`;

      try {
        const response = await this.callLLM(provider, systemPrompt, prompt);
        
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in LLM response:', response);
          throw new Error('LLM did not return valid JSON format');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        // Force needsFollowUp to false since we have answers
        result.needsFollowUp = false;
        result.followUpQuestions = [];
        return result;
      } catch (error) {
        console.error(`Error analyzing requirements with follow-up answers using ${provider}:`, error);
        throw new Error(`Failed to analyze requirements: ${error.message}`);
      }
    } else {
      // Initial analysis - may need follow-up questions
      try {
        // Extract user constraints from requirements
        const userConstraints = this.extractUserConstraints(requirements);
        
        // Add constraint information to the prompt
        const enhancedRequirements = `${requirements}

Detected User Constraints:
${JSON.stringify(userConstraints, null, 2)}`;
        
        const response = await this.callLLM(provider, this.systemPrompts.requirementAnalysis, enhancedRequirements);
        
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in LLM response:', response);
          throw new Error('LLM did not return valid JSON format');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        // Ensure user constraints are preserved in the result
        if (!result.userConstraints) {
          result.userConstraints = userConstraints;
        }
        
        return result;
      } catch (error) {
        console.error(`Error analyzing requirements with ${provider}:`, error);
        throw new Error(`Failed to analyze requirements: ${error.message}`);
      }
    }
  }

  async generateBOM(parsedRequirements, ociServices, provider) {
    // Extract user constraints from parsed requirements
    const userConstraints = parsedRequirements.userConstraints || {};
    
    // Filter services based on user constraints BEFORE sending to LLM
    let filteredServices = ociServices;
    
    if (userConstraints && userConstraints.validationRules?.length > 0) {
      console.log('🔍 Applying customer constraints to filter Oracle services...');
      console.log('📋 Customer constraints:', JSON.stringify(userConstraints, null, 2));
      
      const filterResult = constraintValidator.filterServicesWithConstraints(ociServices, userConstraints);
      filteredServices = filterResult.includedServices;
      
      console.log(`📊 Oracle services filtered from ${ociServices.length} to ${filteredServices.length} based on customer preferences`);
    }
    
    // Create a more concise prompt to avoid token limits
    console.log(`🔍 Processing ${filteredServices.length} filtered services for BOM generation`);
    
    const essentialServices = filteredServices.map((service, index) => {
      // Handle both direct pricing object and array format
      let pricingInfo = null;
      if (service.pricing) {
        if (Array.isArray(service.pricing)) {
          pricingInfo = service.pricing.length > 0 ? service.pricing[0] : null;
        } else {
          pricingInfo = service.pricing;
        }
      }
      
      console.log(`  Service ${index + 1}: ${service.partNumber} - ${service.displayName}`);
      console.log(`    Original pricing:`, service.pricing);
      console.log(`    Processed pricing:`, pricingInfo);
      console.log(`    Has unitPrice:`, pricingInfo?.unitPrice !== undefined);
      
      // Normalize pricing format
      if (pricingInfo && !pricingInfo.unitPrice && pricingInfo.price !== undefined) {
        pricingInfo.unitPrice = pricingInfo.price;
      }
      
      return {
        partNumber: service.partNumber,
        name: service.displayName,
        category: service.serviceCategory,
        pricing: pricingInfo,
        metric: service.metricName || pricingInfo?.unit || pricingInfo?.metricName
      };
    }).filter(service => {
      const hasValidPricing = service.pricing && (service.pricing.unitPrice !== undefined || service.pricing.price !== undefined);
      if (!hasValidPricing) {
        console.log(`❌ Filtered out ${service.partNumber}: Invalid pricing`, service.pricing);
      } else {
        console.log(`✅ Kept ${service.partNumber}: Valid pricing $${service.pricing.unitPrice || service.pricing.price}`);
      }
      return hasValidPricing;
    });

    // Ensure we have at least some services available
    if (essentialServices.length === 0) {
      console.warn('⚠️ No Oracle services with valid pricing found after applying customer filters');
      console.log('🔄 Using fallback pricing for customer presentation');
      
      // Fallback: use filtered services with default pricing structure
      const fallbackServices = filteredServices.slice(0, 10).map(service => ({
        partNumber: service.partNumber,
        name: service.displayName,
        category: service.serviceCategory,
        pricing: {
          unitPrice: 0.05, // Default price
          unit: 'HOUR',
          currency: 'USD',
          model: 'PAYG'
        },
        metric: service.metricName || 'HOUR'
      }));
      
      if (fallbackServices.length === 0) {
        throw new Error('ERROR: No services provided in available services list');
      }
      
      console.log(`📋 Using ${fallbackServices.length} fallback services for BOM generation`);
      return await this.generateBOMPrompt(parsedRequirements, fallbackServices, provider, userConstraints);
    }

    // Limit services further if still too many (but respect constraints)
    const limitedServices = essentialServices.slice(0, 20);
    
    return await this.generateBOMPrompt(parsedRequirements, limitedServices, provider, userConstraints);
  }

  async generateBOMPrompt(parsedRequirements, limitedServices, provider, userConstraints) {
    console.log(`📋 Using ${limitedServices.length} services for BOM generation`);
    limitedServices.forEach(s => {
      const price = s.pricing.unitPrice || s.pricing.price || 'N/A';
      const unit = s.pricing.unit || s.metric || 'N/A';
      console.log(`  - ${s.partNumber}: ${s.name} ($${price}/${unit})`);
    });

    const constraintsText = userConstraints && Object.keys(userConstraints).length > 0 
      ? `\n\n🎯 USER CONSTRAINTS - ABSOLUTE REQUIREMENTS 🎯\n${JSON.stringify(userConstraints, null, 2)}\n\n📋 CONSTRAINT INTERPRETATION:\n${this.generateConstraintInterpretation(userConstraints)}\n\n⚠️ MANDATORY: Only include services that match ALL user constraints. Document constraint compliance for each item.`
      : '';
    
    const prompt = `Requirements Summary: ${JSON.stringify(parsedRequirements)}${constraintsText}
    
Available OCI Services (${limitedServices.length} services - PRE-FILTERED by constraints):
${limitedServices.map(s => {
      const price = s.pricing.unitPrice || s.pricing.price || 0.05;
      const unit = s.pricing.unit || s.metric || 'HOUR';
      return `- ${s.partNumber}: ${s.name} (${s.category}) - Metric: ${s.metric} - Price: $${price}/${unit}`;
    }).join('\n')}

🎯 UNIVERSAL INSTRUCTION: Create BOM using ONLY services from the above PRE-FILTERED list that meet user constraints. Each service has been pre-filtered, but you must still validate against user constraints.

🔍 FOR EACH BOM ITEM: Document why it satisfies user constraints. If including an item that might seem to violate constraints, provide detailed justification.

Create detailed BOM with realistic quantities and constraint compliance documentation.`;

    // Check approximate token count (rough estimate: 1 token ≈ 4 characters)
    const estimatedTokens = (this.systemPrompts.bomGeneration.length + prompt.length) / 4;
    console.log(`Estimated tokens for BOM generation: ${Math.round(estimatedTokens)}`);
    
    if (estimatedTokens > 150000) {
      throw new Error('Prompt still too long after optimization. Please try with fewer requirements.');
    }

    let response;
    try {
      console.log(`🤖 Calling ${provider} for BOM generation...`);
      response = await this.callLLM(provider, this.systemPrompts.bomGeneration, prompt);
      console.log(`📝 ${provider} response length:`, response?.length || 0);
      console.log(`📄 ${provider} response preview:`, response?.substring(0, 200) || 'No response');
      
      // Extract JSON from response - handle markdown code blocks
      let jsonString = response;
      
      // Remove markdown code blocks if present
      if (response.includes('```json')) {
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }
      } else {
        // Fallback to original regex
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      if (!jsonString || (!jsonString.startsWith('{') && !jsonString.startsWith('['))) {
        console.error('❌ No valid JSON found in LLM response from', provider);
        console.error('Full response:', response);
        throw new Error('LLM did not return valid JSON format');
      }
      
      console.log(`🔍 Extracted JSON from ${provider}:`, jsonString.substring(0, 200) + '...');
      
      // Enhanced JSON cleaning with specific focus on notes field quote issues
      let cleanedJson = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
        // Escape control characters first
        .replace(/\n/g, '\\n')  // Escape newlines first
        .replace(/\r/g, '\\r')  // Escape carriage returns  
        .replace(/\t/g, '\\t')  // Escape tabs
        // Specific fix for notes field with embedded quotes - replace with safe characters
        .replace(/"notes":\s*"([^"]*)'([^"]*)"([,}])/g, '"notes": "$1-$2"$3')  // Replace single quotes in notes with hyphens
        .replace(/"notes":\s*"([^"]*)"([^",}]*)"([^",}]*)"([,}])/g, '"notes": "$1-$2-$3"$4')  // Replace problematic internal quotes with hyphens
        // General quote fixes for other fields - replace with safe characters
        .replace(/"([^"]*)'([^"]*)":/g, '"$1-$2":')  // Replace single quotes in keys with hyphens
        .replace(/:\s*"([^"]*)'([^"]*)"([,}])/g, ': "$1-$2"$3')  // Replace single quotes in values with hyphens
      
      console.log(`🧹 Cleaned JSON preview:`, cleanedJson.substring(0, 300) + '...');
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error at position ${parseError.message}:`, parseError.message);
        console.error('🔍 JSON around error position:', 
          cleanedJson.substring(Math.max(0, 1245 - 50), 1245 + 50)
        );
        
        // Try a more aggressive cleaning approach with focus on notes field
        console.log('🔧 Attempting more aggressive JSON cleaning...');
        let aggressiveClean = jsonString
          .replace(/[\n\r\t]/g, ' ')  // Replace all whitespace with spaces
          .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Quote keys
          // Aggressive fix for notes field - replace all problematic quotes with safe characters
          .replace(/"notes":\s*"([^"]*)'([^"]*)"([,}\]])/g, '"notes": "$1-$2"$3')  // Single quotes → hyphens
          .replace(/"notes":\s*"([^"]*)"([^",}]*)"([,}])/g, '"notes": "$1-$2"$3')  // Double quotes → hyphens
          .replace(/"notes":\s*"([^"]*);([^"]*)"([,}])/g, '"notes": "$1-$2"$3')  // Semicolons → hyphens
          .replace(/"notes":\s*"([^"]*):([^"]*)"([,}])/g, '"notes": "$1-$2"$3')  // Colons → hyphens
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .trim();
          
        parsedResult = JSON.parse(aggressiveClean);
      }
      console.log('✅ LLM BOM generation successful. Items count:', parsedResult.items?.length || 0);
      
      // Validate the structure
      if (!parsedResult.items || !Array.isArray(parsedResult.items)) {
        console.error('❌ Invalid BOM structure - missing items array');
        console.error('Parsed result structure:', Object.keys(parsedResult));
        throw new Error('BOM structure invalid - missing items array');
      }
      
      // Final validation against user constraints
      const userConstraints = parsedRequirements.userConstraints || {};
      if (userConstraints && userConstraints.validationRules?.length > 0) {
        console.log('🔎 Final validation of BOM items against customer constraints...');
        
        const validatedItems = [];
        const rejectedItems = [];
        
        for (const item of parsedResult.items) {
          // Create a mock service object for validation
          const mockService = {
            partNumber: item.sku || item.partNumber,
            displayName: item.description || item.displayName,
            serviceCategory: item.category || item.serviceCategory
          };
          
          const validation = constraintValidator.validateServiceAgainstCustomerConstraints(mockService, userConstraints);
          
          if (validation.allowed) {
            validatedItems.push(item);
            console.log(`✅ BOM item validated: ${item.sku} - ${validation.businessJustification}`);
          } else {
            rejectedItems.push({ item, reason: validation.businessJustification || validation.reasons.join('; ') });
            console.log(`❌ BOM item rejected: ${item.sku} - ${validation.businessJustification}`);
          }
        }
        
        if (rejectedItems.length > 0) {
          console.log(`⚠️ Removed ${rejectedItems.length} items that violated user constraints`);
          rejectedItems.forEach(rejected => {
            console.log(`  - ${rejected.item.sku}: ${rejected.reason}`);
          });
        }
        
        // Enhanced business validation with redesigned system
        console.log('📋 Adding comprehensive customer compliance documentation...');
        
        // Add enhanced constraint compliance documentation to each item
        parsedResult.items = validatedItems.map(item => {
          // Create mock service for validation
          const mockService = {
            partNumber: item.sku || item.partNumber,
            displayName: item.description || item.displayName,
            serviceCategory: item.category || item.serviceCategory
          };
          
          const validation = constraintValidator.validateServiceAgainstCustomerConstraints(mockService, userConstraints);
          
          const customerCompliance = {
            customerRequirements: userConstraints,
            validationResult: validation,
            businessJustification: validation.businessJustification,
            constraintCompliance: validation.constraintCompliance,
            customerApproved: validation.allowed,
            salesNotes: validation.businessJustification
          };
          
          return {
            ...item,
            customerCompliance
          };
        });
        
        // Add comprehensive customer-focused compliance summary
        const constraintSummary = constraintValidator.generateConstraintSummary(userConstraints);
        
        parsedResult.customerSummary = {
          totalRecommendedServices: validatedItems.length,
          customerSatisfactionScore: 'High - All items match customer requirements',
          excludedServices: rejectedItems.length,
          excludedReasons: rejectedItems.map(r => ({ 
            service: r.item.sku, 
            businessReason: `Excluded because: ${r.reason.replace('Service', 'This option')}` 
          })),
          constraintSummary: constraintSummary,
          customerRequirements: userConstraints,
          businessValue: 'BOM tailored specifically to customer needs and preferences using Oracle service taxonomy'
        };
        
        console.log(`📊 Final BOM: ${validatedItems.length} items (${rejectedItems.length} rejected by constraints)`);
      }
      
      return parsedResult;
    } catch (error) {
      console.log(`❌ Error creating customer BOM with ${provider}:`, error.message);
      if (response) {
        console.error('📄 Full response for debugging:', response);
      } else {
        console.error('❌ No response received from AI service');
      }
      throw new Error(`Failed to create customer BOM: ${error.message}`);
    }
  }

  async parseDocumentContent(content, provider, documentType, infrastructureData = {}) {
    const systemPrompt = `You are an expert at extracting technical infrastructure requirements from documents. 
    Extract and structure the requirements in a format that can be directly used for Oracle Cloud Infrastructure BOM generation.
    
    IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text, markdown formatting, or anything other than the JSON object.
    
    Required JSON format:
    {
      "compute": {
        "instances": number,
        "cores_per_instance": number,
        "memory_per_instance_gb": number,
        "instance_type": "standard|high_memory|gpu"
      },
      "storage": {
        "block_storage_gb": number,
        "object_storage_gb": number,
        "file_storage_gb": number
      },
      "database": {
        "type": "mysql|postgresql|oracle|none",
        "size": "small|medium|large|xlarge",
        "storage_gb": number
      },
      "network": {
        "load_balancer": boolean,
        "bandwidth_gbps": number,
        "vpn_required": boolean
      },
      "security": {
        "waf_required": boolean,
        "backup_required": boolean,
        "monitoring_required": boolean
      },
      "summary": "Brief summary of the infrastructure requirements"
    }`;

    const userPrompt = `
    Extract infrastructure requirements from this ${documentType} content:
    
    Content:
    ${content.substring(0, 8000)} ${content.length > 8000 ? '... (truncated)' : ''}
    
    ${Object.keys(infrastructureData).length > 0 ? `
    Pre-extracted data found:
    - Compute: ${infrastructureData.compute || 'not specified'}
    - Memory: ${infrastructureData.memory || 'not specified'}
    - Storage: ${infrastructureData.storage || 'not specified'}
    - Network: ${infrastructureData.network || 'not specified'}
    - Instances: ${infrastructureData.instances || 'not specified'}
    - Users: ${infrastructureData.users || 'not specified'}
    
    Use this pre-extracted data as hints but extract additional context from the full content.
    ` : ''}
    
    Focus on:
    1. Compute specifications (CPU cores, RAM, number of instances)
    2. Storage requirements (block, object, file storage needs)
    3. Database requirements (type, size, storage)
    4. Network needs (bandwidth, load balancing, VPN)
    5. Security requirements (WAF, backups, monitoring)
    6. Performance and scalability requirements
    7. Geographic/regional preferences
    
    Extract specific numbers and technical specifications wherever possible.
    `;

    try {
      const response = await this.callLLM(provider, systemPrompt, userPrompt);
      
      // Parse and validate the JSON response
      try {
        const parsedResponse = JSON.parse(response);
        return parsedResponse;
      } catch (parseError) {
        console.warn('LLM returned non-JSON response, attempting to extract JSON...');
        
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback: return the response as summary text
        return {
          compute: { instances: 0, cores_per_instance: 0, memory_per_instance_gb: 0, instance_type: "standard" },
          storage: { block_storage_gb: 0, object_storage_gb: 0, file_storage_gb: 0 },
          database: { type: "none", size: "small", storage_gb: 0 },
          network: { load_balancer: false, bandwidth_gbps: 0, vpn_required: false },
          security: { waf_required: false, backup_required: false, monitoring_required: false },
          summary: response
        };
      }
    } catch (error) {
      console.error(`Error parsing document with ${provider}:`, error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  async callLLM(provider, systemPrompt, userPrompt) {
    switch (provider) {
      case 'openai':
        return await this.callOpenAI(systemPrompt, userPrompt);
      case 'claude':
        return await this.callClaude(systemPrompt, userPrompt);
      case 'gemini':
        return await this.callGemini(systemPrompt, userPrompt);
      case 'grok':
        return await this.callGrok(systemPrompt, userPrompt);
      case 'deepseek':
        return await this.callDeepSeek(systemPrompt, userPrompt);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  async callOpenAI(systemPrompt, userPrompt) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  }

  async callClaude(systemPrompt, userPrompt) {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    return response.content[0].text;
  }

  async callGemini(systemPrompt, userPrompt) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.');
    }

    // Use the current Gemini 2.5 Pro model
    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    const prompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;
    const result = await model.generateContent(prompt);
    
    return result.response.text();
  }

  async callGrok(systemPrompt, userPrompt) {
    // Grok API integration - using grok-4-latest model
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-4-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  async callDeepSeek(systemPrompt, userPrompt) {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }
}

module.exports = new LLMService();