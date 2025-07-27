#!/usr/bin/env node

// Standalone test for constraint detection without API dependencies

// Copy the constraint detection logic from LLMService
class ConstraintTester {
  constructor() {
    // Instruction detection patterns
    this.instructionPatterns = {
      restrictive: [
        /only\s+(consider|use|include)\s+([^,\.\n]+)/gi,
        /exclusively\s+([^,\.\n]+)/gi,
        /specifically\s+([^,\.\n]+)/gi,
        /must\s+(be|use|include)\s+([^,\.\n]+)/gi,
        /required?\s*:\s*([^,\.\n]+)/gi,
        /constraint\s*:\s*([^,\.\n]+)/gi,
        /limitation\s*:\s*([^,\.\n]+)/gi
      ],
      scope: [
        /do\s+not\s+(include|add|consider)\s+([^,\.\n]+)/gi,
        /exclude\s+([^,\.\n]+)/gi,
        /avoid\s+([^,\.\n]+)/gi,
        /no\s+([^,\.\n]+)/gi
      ],
      specific_sku: [
        /sku\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /part\s*number\s*:?\s*([A-Za-z0-9\-_]+)/gi,
        /service\s*code\s*:?\s*([A-Za-z0-9\-_]+)/gi
      ]
    };
  }

  // Extract specific user instructions and constraints
  extractUserConstraints(requirementsText) {
    const constraints = {
      restrictive: [],
      exclusions: [],
      specificSkus: [],
      mustInclude: [],
      mustExclude: []
    };

    const text = requirementsText.toLowerCase();

    // Extract restrictive instructions ("only", "exclusively")
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

    // Extract exclusions ("do not", "exclude")
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

    // Extract specific SKUs/part numbers
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

  // Validate if a service meets user constraints
  validateServiceAgainstConstraints(service, constraints, requirements) {
    const serviceName = service.displayName?.toLowerCase() || '';
    const serviceCategory = service.serviceCategory?.toLowerCase() || '';
    const partNumber = service.partNumber?.toLowerCase() || '';
    
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

    // Check exclusions
    for (const exclusion of constraints.exclusions) {
      const excludeText = exclusion.instruction.toLowerCase();
      
      // Check for service category exclusions
      if (excludeText.includes('storage') && serviceCategory.includes('storage')) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
      if ((excludeText.includes('network') || excludeText.includes('networking')) && serviceCategory.includes('network')) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
      if (excludeText.includes('premium') && serviceName.includes('premium')) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
      if (excludeText.includes('enterprise') && serviceName.includes('enterprise')) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
      
      // General exclusion check
      if (serviceName.includes(excludeText) || serviceCategory.includes(excludeText)) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
    }

    // Check restrictive constraints
    if (constraints.restrictive.length > 0) {
      let matchesRestriction = false;
      
      for (const restriction of constraints.restrictive) {
        const restrictText = restriction.instruction.toLowerCase();
        
        // Check for service category matches
        const categoryKeywords = ['compute', 'storage', 'database', 'networking', 'network'];
        const restrictionHasCategory = categoryKeywords.some(cat => restrictText.includes(cat));
        
        if (restrictionHasCategory) {
          // Category-based restriction
          if (restrictText.includes('compute') && serviceCategory.includes('compute')) {
            matchesRestriction = true;
            break;
          }
          if (restrictText.includes('storage') && serviceCategory.includes('storage')) {
            matchesRestriction = true;
            break;
          }
          if (restrictText.includes('database') && serviceCategory.includes('database')) {
            matchesRestriction = true;
            break;
          }
          if ((restrictText.includes('network') || restrictText.includes('networking')) && serviceCategory.includes('network')) {
            matchesRestriction = true;
            break;
          }
        } else {
          // General text-based restriction
          if (serviceName.includes(restrictText) || serviceCategory.includes(restrictText) || partNumber.includes(restrictText)) {
            matchesRestriction = true;
            break;
          }
        }
      }
      
      if (!matchesRestriction) {
        return {
          allowed: false,
          reason: `Service doesn't match restrictive constraint: ${constraints.restrictive.map(r => r.fullMatch).join(', ')}`
        };
      }
    }

    return { allowed: true, reason: 'Service meets all constraints' };
  }
}

// Test cases
const testCases = [
  {
    name: "Specific SKU constraint",
    requirements: "Generate BOM for Oracle database, only consider Oracle Base Database Service using BYOL SKU B88317"
  },
  {
    name: "Restrictive constraint",
    requirements: "Need cloud infrastructure, only compute services, no storage or networking"
  },
  {
    name: "Exclusion constraint", 
    requirements: "Set up web servers with databases, exclude any premium or enterprise services"
  },
  {
    name: "Multiple constraints",
    requirements: "Only consider standard compute instances using SKU B88317, do not include any networking services, exclusively PAYG model"
  },
  {
    name: "No constraints",
    requirements: "Need a simple web application with database and load balancer"
  }
];

// Mock services for validation testing
const mockServices = [
  {
    partNumber: 'B88317',
    displayName: 'Compute - Standard - E4 - OCPU Hour',
    serviceCategory: 'Compute'
  },
  {
    partNumber: 'B88318',
    displayName: 'Block Storage - Premium',
    serviceCategory: 'Storage'
  },
  {
    partNumber: 'B91969',
    displayName: 'Load Balancer - Flexible',
    serviceCategory: 'Networking'
  },
  {
    partNumber: 'B89729',
    displayName: 'Database - Premium - Enterprise',
    serviceCategory: 'Database'
  }
];

console.log('🧪 Testing User Constraint Detection and Validation\n');

const tester = new ConstraintTester();

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`Requirements: "${testCase.requirements}"`);
  
  const constraints = tester.extractUserConstraints(testCase.requirements);
  
  console.log('Detected Constraints:');
  console.log(`  - Restrictive: ${constraints.restrictive.length} items`);
  constraints.restrictive.forEach(r => console.log(`    • "${r.fullMatch}"`));
  
  console.log(`  - Exclusions: ${constraints.exclusions.length} items`);
  constraints.exclusions.forEach(e => console.log(`    • "${e.fullMatch}"`));
  
  console.log(`  - Specific SKUs: ${constraints.specificSkus.length} items`);
  constraints.specificSkus.forEach(s => console.log(`    • "${s.sku}" from "${s.fullMatch}"`));
  
  if (constraints.restrictive.length > 0 || constraints.exclusions.length > 0 || constraints.specificSkus.length > 0) {
    console.log('\n  Service Validation Results:');
    mockServices.forEach(service => {
      const validation = tester.validateServiceAgainstConstraints(service, constraints, {});
      const status = validation.allowed ? '✅' : '❌';
      console.log(`    ${status} ${service.partNumber} (${service.serviceCategory}): ${validation.reason}`);
    });
  }
  
  console.log('---');
});

console.log('\n✅ Constraint detection and validation test completed');