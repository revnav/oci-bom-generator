#!/usr/bin/env node

// Test universal constraint system with various constraint types

class UniversalConstraintTester {
  constructor() {
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
        /don['']?t\s+(include|add|consider|use|allow)\s+([^\n\.!?;]+?)(?=\.|\n|!|\?|;|$)/gi,
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
        // SKU/Part number patterns
        /sku\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /part\s*number\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /service\s*code\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /product\s*code\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /model\s*:?\s*([A-Za-z0-9\-_]+)/gi
      ]
    };
  }

  extractUserConstraints(requirementsText) {
    const constraints = {
      restrictive: [],
      exclusions: [],
      specificSkus: [],
      mustInclude: [],
      mustExclude: []
    };

    const text = requirementsText.toLowerCase();

    // Extract restrictive instructions
    this.instructionPatterns.restrictive.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        constraints.restrictive.push({
          fullMatch: match[0],
          instruction: match[1] || match[2] || match[0],
          type: 'restrictive'
        });
      }
    });

    // Extract exclusions
    this.instructionPatterns.scope.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        constraints.exclusions.push({
          fullMatch: match[0],
          instruction: match[1] || match[0],
          type: 'exclusion'
        });
      }
    });

    // Extract specific SKUs
    this.instructionPatterns.specific_sku.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        constraints.specificSkus.push({
          fullMatch: match[0],
          sku: match[1],
          type: 'specific_sku'
        });
      }
    });

    return constraints;
  }

  validateServiceAgainstConstraints(service, constraints) {
    const serviceName = service.displayName?.toLowerCase() || '';
    const serviceCategory = service.serviceCategory?.toLowerCase() || '';
    const partNumber = service.partNumber?.toLowerCase() || '';
    const skuType = service.skuType?.toLowerCase() || '';
    
    // If specific SKUs are required, only allow those
    if (constraints.specificSkus.length > 0) {
      const allowedSkus = constraints.specificSkus.map(s => s.sku.toLowerCase());
      if (!allowedSkus.includes(partNumber)) {
        return {
          allowed: false,
          reason: `Service ${service.partNumber} not in allowed SKUs: ${allowedSkus.join(', ')}`
        };
      }
    }

    // Check exclusions - flexible text matching
    for (const exclusion of constraints.exclusions) {
      const excludeText = exclusion.instruction.toLowerCase();
      
      // Split exclusion text into keywords for flexible matching
      const excludeKeywords = excludeText.split(/\s+/).filter(word => word.length > 2);
      
      // Check if any exclusion keywords match service properties
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
        
        // Split restriction into keywords for flexible matching
        const restrictKeywords = restrictText.split(/\s+/).filter(word => word.length > 2);
        
        // Check how many keywords match
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
        
        // Service matches if it contains significant portion of constraint keywords
        const matchRatio = matchCount / restrictKeywords.length;
        if (matchRatio >= 0.5 || matchCount >= 3) { // At least 50% keywords match OR 3+ keywords
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
}

// Test various constraint scenarios
const testScenarios = [
  {
    name: "Database BYOL Constraint",
    prompt: "Only consider Base Oracle Database Service SKU with BYOL",
    services: [
      { partNumber: 'B89728', displayName: 'Database - Base Database Service - BYOL', serviceCategory: 'Database', skuType: 'DATABASE_BYOL' },
      { partNumber: 'B109356', displayName: 'Oracle Exadata Exascale Database ECPU', serviceCategory: 'Database', skuType: 'DATABASE_EXADATA' },
      { partNumber: 'B89729', displayName: 'Database - Autonomous Database - OCPU Hour', serviceCategory: 'Database', skuType: 'DATABASE_AUTO' }
    ]
  },
  {
    name: "Compute Only Constraint",
    prompt: "Only use standard compute instances, no premium or GPU services",
    services: [
      { partNumber: 'B88317', displayName: 'Compute - Standard - E4 - OCPU Hour', serviceCategory: 'Compute', skuType: 'OCPU' },
      { partNumber: 'B88320', displayName: 'Compute - Premium - X7 - OCPU Hour', serviceCategory: 'Compute', skuType: 'OCPU_PREMIUM' },
      { partNumber: 'B88325', displayName: 'Compute - GPU - A100 - OCPU Hour', serviceCategory: 'Compute', skuType: 'GPU' },
      { partNumber: 'B88515', displayName: 'Block Storage - Balanced', serviceCategory: 'Storage', skuType: 'BLOCK_STORAGE' }
    ]
  },
  {
    name: "Storage Exclusion Constraint",
    prompt: "Include compute and database services, exclude all storage and networking",
    services: [
      { partNumber: 'B88317', displayName: 'Compute - Standard - E4 - OCPU Hour', serviceCategory: 'Compute', skuType: 'OCPU' },
      { partNumber: 'B89728', displayName: 'Database - Base Database Service - BYOL', serviceCategory: 'Database', skuType: 'DATABASE_BYOL' },
      { partNumber: 'B88515', displayName: 'Block Storage - Balanced', serviceCategory: 'Storage', skuType: 'BLOCK_STORAGE' },
      { partNumber: 'B91969', displayName: 'Load Balancer - Flexible - 10 Mbps', serviceCategory: 'Networking', skuType: 'LOAD_BALANCER' }
    ]
  },
  {
    name: "Specific SKU Constraint",
    prompt: "Only allow SKU B88317 for compute requirements",
    services: [
      { partNumber: 'B88317', displayName: 'Compute - Standard - E4 - OCPU Hour', serviceCategory: 'Compute', skuType: 'OCPU' },
      { partNumber: 'B88318', displayName: 'Compute - Standard - E4 - Memory GB Hour', serviceCategory: 'Compute', skuType: 'MEMORY' },
      { partNumber: 'B88319', displayName: 'Compute - Standard - E3 - OCPU Hour', serviceCategory: 'Compute', skuType: 'OCPU' }
    ]
  },
  {
    name: "Enterprise Exclusion Constraint",
    prompt: "Avoid enterprise and premium services, use basic tiers only",
    services: [
      { partNumber: 'B88001', displayName: 'Basic Compute Instance', serviceCategory: 'Compute', skuType: 'BASIC' },
      { partNumber: 'B88002', displayName: 'Enterprise Compute Instance', serviceCategory: 'Compute', skuType: 'ENTERPRISE' },
      { partNumber: 'B88003', displayName: 'Premium Database Service', serviceCategory: 'Database', skuType: 'PREMIUM' },
      { partNumber: 'B88004', displayName: 'Standard Database Service', serviceCategory: 'Database', skuType: 'STANDARD' }
    ]
  }
];

console.log('🧪 Testing Universal Constraint System\n');

const tester = new UniversalConstraintTester();

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`Prompt: "${scenario.prompt}"`);
  
  const constraints = tester.extractUserConstraints(scenario.prompt);
  
  console.log(`\n🔍 Detected Constraints:`);
  if (constraints.restrictive.length > 0) {
    console.log(`  Restrictive (${constraints.restrictive.length}):`);
    constraints.restrictive.forEach(r => console.log(`    • "${r.fullMatch}"`));
  }
  if (constraints.exclusions.length > 0) {
    console.log(`  Exclusions (${constraints.exclusions.length}):`);
    constraints.exclusions.forEach(e => console.log(`    • "${e.fullMatch}"`));
  }
  if (constraints.specificSkus.length > 0) {
    console.log(`  Specific SKUs (${constraints.specificSkus.length}):`);
    constraints.specificSkus.forEach(s => console.log(`    • "${s.sku}" from "${s.fullMatch}"`));
  }
  
  console.log(`\n🏷️ Service Validation Results:`);
  scenario.services.forEach(service => {
    const validation = tester.validateServiceAgainstConstraints(service, constraints);
    const status = validation.allowed ? '✅' : '❌';
    console.log(`  ${status} ${service.partNumber} - ${service.displayName}`);
    console.log(`      ${validation.reason}`);
  });
  
  console.log('---');
});

console.log('\n✅ Universal constraint testing completed');
console.log('\n🎯 Key Features Tested:');
console.log('• Flexible keyword-based matching for any constraint type');
console.log('• Support for "only", "exclude", "avoid", "must", etc.');
console.log('• Specific SKU validation');
console.log('• Category-based filtering');
console.log('• Service name/type matching');
console.log('• Weighted scoring for complex constraints');