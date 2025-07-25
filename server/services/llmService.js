const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

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

    // System prompts for different tasks
    this.systemPrompts = {
      requirementAnalysis: `You are an Oracle Cloud Infrastructure (OCI) expert and solutions architect. 
      Analyze the provided requirements and extract specific infrastructure needs including:
      - Compute requirements (CPU, RAM, instances)
      - Storage needs (block, object, file storage)
      - Network requirements (bandwidth, load balancers)
      - Database services needed
      - Security requirements
      - Backup and disaster recovery needs
      - Regional/availability zone preferences
      
      If information is missing or unclear, identify specific follow-up questions to ask.
      
      IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or anything other than the JSON object. Start your response with { and end with }. Required format: {"parsedRequirements": {...}, "needsFollowUp": boolean, "followUpQuestions": [...]}`,

      bomGeneration: `You are creating a detailed Bill of Materials (BOM) for Oracle Cloud Infrastructure services.
      Based on the analyzed requirements and available OCI services with pricing, create a comprehensive BOM.
      
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
          }
        ]
      }
      
      Calculate realistic quantities based on requirements. Use the provided OCI services and their exact part numbers and pricing.
      
      IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or anything other than the JSON object. Start your response with { and end with }.`
    };
  }

  async analyzeRequirements(requirements, provider, followUpAnswers = null) {
    if (followUpAnswers) {
      // When follow-up answers are provided, create a comprehensive analysis
      const prompt = `Original requirements: ${requirements}\n\nFollow-up answers: ${JSON.stringify(followUpAnswers)}\n\nNow provide a complete analysis with all the information provided. Do not ask for additional follow-up questions since they have already been answered.`;
      
      const systemPrompt = `You are an Oracle Cloud Infrastructure (OCI) expert and solutions architect. 
      Analyze the provided requirements and follow-up answers to extract complete infrastructure needs including:
      - Compute requirements (CPU, RAM, instances)
      - Storage needs (block, object, file storage)
      - Network requirements (bandwidth, load balancers)
      - Database services needed
      - Security requirements
      - Backup and disaster recovery needs
      - Regional/availability zone preferences
      
      Since follow-up questions have been answered, provide a complete analysis without requesting additional information.
      Respond in JSON format with: parsedRequirements, needsFollowUp (always false), followUpQuestions (empty array)`;

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
        const response = await this.callLLM(provider, this.systemPrompts.requirementAnalysis, requirements);
        
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in LLM response:', response);
          throw new Error('LLM did not return valid JSON format');
        }
        
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error(`Error analyzing requirements with ${provider}:`, error);
        throw new Error(`Failed to analyze requirements: ${error.message}`);
      }
    }
  }

  async generateBOM(parsedRequirements, ociServices, provider) {
    // Create a more concise prompt to avoid token limits
    const essentialServices = ociServices.map(service => ({
      partNumber: service.partNumber,
      name: service.displayName,
      category: service.serviceCategory,
      pricing: service.pricing?.length > 0 ? service.pricing[0] : null,
      metric: service.metricName || service.pricing?.[0]?.unit
    })).filter(service => service.pricing); // Only include services with pricing

    // Limit services further if still too many
    const limitedServices = essentialServices.slice(0, 15);

    const prompt = `Requirements Summary: ${JSON.stringify(parsedRequirements)}
    
Available OCI Services (${limitedServices.length} services):
${limitedServices.map(s => `- ${s.partNumber}: ${s.name} (${s.category}) - Metric: ${s.metric} - Price: $${s.pricing.unitPrice}/${s.pricing.unit}`).join('\n')}

Create a detailed BOM with realistic quantities and pricing calculations.`;

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
      
      // Try to fix common JSON issues before parsing
      let cleanedJson = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
      
      const parsedResult = JSON.parse(cleanedJson);
      console.log('✅ LLM BOM generation successful. Items count:', parsedResult.items?.length || 0);
      
      // Validate the structure
      if (!parsedResult.items || !Array.isArray(parsedResult.items)) {
        console.error('❌ Invalid BOM structure - missing items array');
        console.error('Parsed result structure:', Object.keys(parsedResult));
        throw new Error('BOM structure invalid - missing items array');
      }
      
      return parsedResult;
    } catch (error) {
      console.error(`❌ Error generating BOM with ${provider}:`, error.message);
      if (response) {
        console.error('📄 Full raw response for debugging:', response);
      } else {
        console.error('❌ No response received from LLM');
      }
      throw new Error(`Failed to generate BOM: ${error.message}`);
    }
  }

  async parseDocumentContent(content, provider, documentType) {
    const prompt = `
    Extract infrastructure requirements from this ${documentType} content:
    
    ${content}
    
    Look for:
    - Server/compute specifications
    - Storage requirements
    - Network/bandwidth needs
    - Database requirements
    - Security requirements
    - Performance requirements
    - Compliance needs
    - Geographic/regional requirements
    
    Provide a structured summary of the infrastructure requirements found.
    `;

    try {
      const response = await this.callLLM(provider, 'You are an expert at extracting technical requirements from documents.', prompt);
      return response;
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
    // Grok API integration - update endpoint when available
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-beta',
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