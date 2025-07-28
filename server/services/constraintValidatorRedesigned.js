/**
 * Redesigned Constraint Validation System
 * 
 * This replaces the ad-hoc constraint validation with a systematic approach
 * that understands Oracle's business taxonomy and handles sales-friendly language.
 */
class ConstraintValidatorRedesigned {
  constructor() {
    // Oracle business terminology mappings
    this.oracleTerminologyMap = {
      // Database service terms
      'base database': ['base database service', 'database service', 'oracle database'],
      'database': ['database', 'db'],
      'autonomous': ['autonomous database', 'autonomous', 'adb'],
      'exadata': ['exadata database service', 'exadata'],
      'mysql': ['mysql database service', 'mysql'],
      
      // Compute service terms  
      'app server': ['compute', 'server', 'application server', 'instance', 'vm'],
      'server': ['compute', 'server', 'instance', 'vm'],
      'compute': ['compute', 'server', 'instance', 'vm'],
      
      // Storage service terms
      'storage': ['storage', 'block storage', 'object storage', 'file storage'],
      'block storage': ['block storage', 'block volume'],
      'object storage': ['object storage'],
      
      // Networking terms
      'load balancer': ['load balancer', 'lb'],
      'network': ['networking', 'network', 'vcn'],
      
      // Licensing terms
      'byol': ['byol', 'bring your own license'],
      'license included': ['license included', 'li']
    };

    // Business preference mappings
    this.businessPreferenceMap = {
      'budget-conscious': { tier: 'standard', optimize: 'cost' },
      'cost-effective': { tier: 'standard', optimize: 'cost' },
      'basic': { tier: 'standard', optimize: 'cost' },
      'standard': { tier: 'standard', optimize: 'balanced' },
      'high-performance': { tier: 'enterprise', optimize: 'performance' },
      'enterprise': { tier: 'enterprise', optimize: 'performance' },
      'premium': { tier: 'enterprise', optimize: 'performance' }
    };
  }

  /**
   * Extract and parse customer constraints from natural language
   */
  extractCustomerConstraints(requirementsText) {
    const text = requirementsText.toLowerCase();
    const constraints = {
      restrictive: [],
      exclusions: [],
      businessPreferences: {},
      oracleServices: [],
      validationRules: []
    };

    // Extract "only" constraints with Oracle terminology awareness
    this.extractRestrictiveConstraints(text, constraints);
    
    // Extract exclusion constraints
    this.extractExclusionConstraints(text, constraints);
    
    // Extract business preferences
    this.extractBusinessPreferences(text, constraints);
    
    // Extract specific Oracle service mentions
    this.extractOracleServiceMentions(text, constraints);
    
    // Generate validation rules from constraints
    this.generateValidationRules(constraints);
    
    return constraints;
  }

  extractRestrictiveConstraints(text, constraints) {
    // Pattern: "only [service/category]"
    const onlyPatterns = [
      /only\s+(consider\s+)?([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /just\s+(want\s+|need\s+)?([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /specifically\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /exclusively\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi
    ];

    for (const pattern of onlyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const constraintText = (match[2] || match[1]).trim();
        const oracleTerms = this.mapToOracleTerminology(constraintText);
        
        constraints.restrictive.push({
          originalText: match[0],
          customerLanguage: constraintText,
          oracleTerms: oracleTerms,
          type: 'restrictive'
        });
      }
    }
  }

  extractExclusionConstraints(text, constraints) {
    // Pattern: "no [service]", "don't want [service]", "exclude [service]"
    const exclusionPatterns = [
      /no\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /(don'?t|dont)\s+(want\s+|need\s+|use\s+)?([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /exclude\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /avoid\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi,
      /without\s+([^.,!?;]+?)(?=\.|,|!|\?|;|$)/gi
    ];

    for (const pattern of exclusionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const constraintText = (match[3] || match[1]).trim();
        const oracleTerms = this.mapToOracleTerminology(constraintText);
        
        constraints.exclusions.push({
          originalText: match[0],
          customerLanguage: constraintText,
          oracleTerms: oracleTerms,
          type: 'exclusion'
        });
      }
    }
  }

  extractBusinessPreferences(text, constraints) {
    for (const [preference, mapping] of Object.entries(this.businessPreferenceMap)) {
      if (text.includes(preference)) {
        constraints.businessPreferences[preference] = mapping;
      }
    }

    // Extract user count for sizing
    const userMatch = text.match(/(\\d+)\\s*(?:users?|people|employees?|concurrent)/);
    if (userMatch) {
      constraints.businessPreferences.userCount = parseInt(userMatch[1]);
    }

    // Extract licensing preferences
    if (text.includes('existing') && (text.includes('license') || text.includes('oracle'))) {
      constraints.businessPreferences.licensing = 'byol';
    } else if (text.includes('no license') || text.includes('new license')) {
      constraints.businessPreferences.licensing = 'license_included';
    }
  }

  extractOracleServiceMentions(text, constraints) {
    // Look for specific Oracle service mentions
    const oracleServicePatterns = [
      /oracle\\s+database/gi,
      /base\\s+database/gi,
      /autonomous\\s+database/gi,
      /exadata/gi,
      /mysql/gi,
      /compute/gi,
      /block\\s+storage/gi,
      /object\\s+storage/gi,
      /load\\s+balancer/gi
    ];

    for (const pattern of oracleServicePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          constraints.oracleServices.push(match.toLowerCase());
        }
      }
    }
  }

  mapToOracleTerminology(customerText) {
    const oracleTerms = [];
    const text = customerText.toLowerCase();
    
    for (const [customerTerm, oracleVariants] of Object.entries(this.oracleTerminologyMap)) {
      if (text.includes(customerTerm)) {
        oracleTerms.push(...oracleVariants);
      }
    }
    
    return [...new Set(oracleTerms)]; // Remove duplicates
  }

  generateValidationRules(constraints) {
    // Create specific validation rules based on extracted constraints
    
    // Restrictive rules: service must match at least one restrictive constraint
    if (constraints.restrictive.length > 0) {
      constraints.validationRules.push({
        type: 'must_match_restrictive',
        description: 'Service must match customer\'s "only" requirements',
        constraints: constraints.restrictive
      });
    }
    
    // Exclusion rules: service must not match any exclusion constraint
    if (constraints.exclusions.length > 0) {
      constraints.validationRules.push({
        type: 'must_not_match_exclusions',
        description: 'Service must not match customer\'s exclusions',
        constraints: constraints.exclusions
      });
    }
    
    // Business preference rules
    if (Object.keys(constraints.businessPreferences).length > 0) {
      constraints.validationRules.push({
        type: 'business_preferences',
        description: 'Service should align with customer\'s business preferences',
        preferences: constraints.businessPreferences
      });
    }
  }

  /**
   * Validate a service against customer constraints
   */
  validateServiceAgainstCustomerConstraints(service, constraints) {
    const validationResult = {
      allowed: true,
      score: 1.0,
      reasons: [],
      businessJustification: '',
      constraintCompliance: {}
    };

    // Apply each validation rule
    for (const rule of constraints.validationRules) {
      const ruleResult = this.applyValidationRule(service, rule);
      
      // Update overall result
      if (!ruleResult.passed) {
        validationResult.allowed = false;
      }
      
      validationResult.score *= ruleResult.score;
      validationResult.reasons.push(ruleResult.reason);
      validationResult.constraintCompliance[rule.type] = ruleResult;
    }

    // Generate business justification
    validationResult.businessJustification = this.generateBusinessJustification(service, constraints, validationResult);
    
    return validationResult;
  }

  applyValidationRule(service, rule) {
    switch (rule.type) {
      case 'must_match_restrictive':
        return this.validateRestrictiveRule(service, rule);
      
      case 'must_not_match_exclusions':
        return this.validateExclusionRule(service, rule);
      
      case 'business_preferences':
        return this.validateBusinessPreferences(service, rule);
      
      default:
        return { passed: true, score: 1.0, reason: 'Unknown rule type' };
    }
  }

  validateRestrictiveRule(service, rule) {
    const serviceText = `${service.displayName} ${service.serviceCategory} ${service.productFamily || ''}`.toLowerCase();
    
    // Service must match at least one restrictive constraint
    for (const constraint of rule.constraints) {
      for (const oracleTerm of constraint.oracleTerms) {
        if (serviceText.includes(oracleTerm.toLowerCase())) {
          return {
            passed: true,
            score: 1.0,
            reason: `✅ Matches customer requirement: "${constraint.customerLanguage}" (Oracle term: ${oracleTerm})`
          };
        }
      }
    }
    
    return {
      passed: false,
      score: 0.0,
      reason: `❌ Doesn't match customer's "only" requirement: ${rule.constraints.map(c => c.customerLanguage).join(', ')}`
    };
  }

  validateExclusionRule(service, rule) {
    const serviceText = `${service.displayName} ${service.serviceCategory} ${service.productFamily || ''}`.toLowerCase();
    
    // Service must not match any exclusion constraint
    for (const constraint of rule.constraints) {
      for (const oracleTerm of constraint.oracleTerms) {
        if (serviceText.includes(oracleTerm.toLowerCase())) {
          return {
            passed: false,
            score: 0.0,
            reason: `❌ Matches customer exclusion: "${constraint.customerLanguage}" (Oracle term: ${oracleTerm})`
          };
        }
      }
    }
    
    return {
      passed: true,
      score: 1.0,
      reason: `✅ Doesn't match any customer exclusions`
    };
  }

  validateBusinessPreferences(service, rule) {
    let score = 1.0;
    const reasons = [];
    
    // Check tier preferences
    if (rule.preferences.tier && service.tier) {
      if (service.tier === rule.preferences.tier) {
        reasons.push(`✅ Matches preferred tier: ${service.tier}`);
        score *= 1.2; // Boost for tier match
      } else if (rule.preferences.tier === 'standard' && service.tier === 'enterprise') {
        reasons.push(`⚠️ Higher tier than preferred (customer wants ${rule.preferences.tier}, service is ${service.tier})`);
        score *= 0.7; // Reduce score for expensive service when budget-conscious
      }
    }
    
    // Check licensing preferences
    if (rule.preferences.licensing && service.licensingModel) {
      if (service.licensingModel === rule.preferences.licensing) {
        reasons.push(`✅ Matches licensing preference: ${service.licensingModel}`);
        score *= 1.1; // Small boost for licensing match
      } else {
        reasons.push(`⚠️ Different licensing model (customer prefers ${rule.preferences.licensing}, service is ${service.licensingModel})`);
        score *= 0.9; // Small penalty for licensing mismatch
      }
    }
    
    return {
      passed: true, // Business preferences don't fail validation, just adjust score
      score: Math.min(score, 1.5), // Cap the boost
      reason: reasons.join('; ') || 'No specific business preferences to evaluate'
    };
  }

  generateBusinessJustification(service, constraints, validationResult) {
    const justifications = [];
    
    if (validationResult.allowed) {
      justifications.push(`This Oracle service meets all customer requirements.`);
      
      // Add specific constraint matches
      if (constraints.restrictive.length > 0) {
        const matches = constraints.restrictive.filter(r => 
          r.oracleTerms.some(term => 
            service.displayName?.toLowerCase().includes(term.toLowerCase())
          )
        );
        if (matches.length > 0) {
          justifications.push(`Specifically matches customer's requirement for: ${matches.map(m => m.customerLanguage).join(', ')}.`);
        }
      }
      
      // Add business value
      if (service.businessDescription) {
        justifications.push(service.businessDescription);
      }
      
      // Add cost optimization notes
      if (constraints.businessPreferences?.tier === 'standard' && service.tier === 'standard') {
        justifications.push('Cost-optimized choice aligning with customer\'s budget preferences.');
      }
      
    } else {
      justifications.push(`This service was excluded because it doesn't meet customer requirements.`);
      
      // Add specific failure reasons
      const failureReasons = validationResult.reasons.filter(r => r.includes('❌'));
      if (failureReasons.length > 0) {
        justifications.push(failureReasons.join(' '));
      }
    }
    
    return justifications.join(' ');
  }

  /**
   * Filter services based on customer constraints
   */
  filterServicesWithConstraints(services, constraints) {
    console.log(`🔍 Filtering ${services.length} Oracle services with customer constraints...`);
    console.log(`📋 Customer constraints:`, JSON.stringify(constraints, null, 2));
    
    const filteredServices = [];
    const rejectedServices = [];
    
    for (const service of services) {
      const validation = this.validateServiceAgainstCustomerConstraints(service, constraints);
      
      console.log(`🔎 Evaluating: ${service.partNumber} - ${service.displayName}`);
      console.log(`   ${validation.allowed ? '✅ INCLUDED' : '❌ EXCLUDED'}: ${validation.reasons.join('; ')}`);
      
      if (validation.allowed) {
        filteredServices.push({
          ...service,
          constraintValidation: validation
        });
      } else {
        rejectedServices.push({
          service: service,
          rejectionReason: validation.reasons.join('; ')
        });
      }
    }
    
    console.log(`📊 Constraint filtering results: ${filteredServices.length} included, ${rejectedServices.length} excluded`);
    
    return {
      includedServices: filteredServices,
      rejectedServices: rejectedServices,
      constraintsSummary: {
        totalEvaluated: services.length,
        included: filteredServices.length,
        excluded: rejectedServices.length,
        constraints: constraints
      }
    };
  }

  /**
   * Generate customer-friendly constraint summary for reports
   */
  generateConstraintSummary(constraints) {
    const summary = {
      customerRequirements: [],
      businessPreferences: [],
      excludedItems: []
    };
    
    // Summarize restrictive constraints
    for (const constraint of constraints.restrictive) {
      summary.customerRequirements.push({
        requirement: constraint.customerLanguage,
        interpretation: `Customer specifically requested: ${constraint.customerLanguage}`,
        oracleMapping: constraint.oracleTerms.join(', ')
      });
    }
    
    // Summarize exclusions
    for (const constraint of constraints.exclusions) {
      summary.excludedItems.push({
        exclusion: constraint.customerLanguage,
        interpretation: `Customer specifically excluded: ${constraint.customerLanguage}`,
        oracleMapping: constraint.oracleTerms.join(', ')
      });
    }
    
    // Summarize business preferences
    for (const [preference, mapping] of Object.entries(constraints.businessPreferences)) {
      summary.businessPreferences.push({
        preference: preference,
        implication: this.getBusinessImplication(preference, mapping)
      });
    }
    
    return summary;
  }

  getBusinessImplication(preference, mapping) {
    const implications = {
      'budget-conscious': 'Prioritize cost-effective Oracle services',
      'cost-effective': 'Focus on standard tier services for optimal value',
      'high-performance': 'Recommend enterprise-grade Oracle services',
      'enterprise': 'Include premium Oracle services with advanced features',
      'byol': 'Use Bring Your Own License options to leverage existing Oracle investments',
      'license_included': 'Include Oracle license costs in service pricing'
    };
    
    return implications[preference] || `Customer preference: ${preference}`;
  }
}

module.exports = new ConstraintValidatorRedesigned();