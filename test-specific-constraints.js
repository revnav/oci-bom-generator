#!/usr/bin/env node

// Test specific constraint scenarios from the user's prompt

// Copy the constraint detection logic
class ConstraintTester {
  constructor() {
    this.instructionPatterns = {
      restrictive: [
        /only\s+(consider|use|include)\s+([^,\.\n]+)/gi,
        /exclusively\s+([^,\.\n]+)/gi,
        /specifically\s+([^,\.\n]+)/gi,
        /must\s+(be|use|include)\s+([^,\.\n]+)/gi,
        /required?\s*:\s*([^,\.\n]+)/gi,
        /constraint\s*:\s*([^,\.\n]+)/gi,
        /limitation\s*:\s*([^,\.\n]+)/gi,
        /base\s+oracle\s+database\s+service.*?byol/gi,
        /oracle\s+base\s+database.*?byol/gi
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
    
    // Check restrictive constraints
    if (constraints.restrictive.length > 0) {
      let matchesRestriction = false;
      
      for (const restriction of constraints.restrictive) {
        const restrictText = restriction.instruction.toLowerCase();
        
        // Special handling for "Base Oracle Database Service with BYOL"
        if (restrictText.includes('base oracle database service') || restrictText.includes('base database service')) {
          if (serviceName.includes('base database service') && serviceName.includes('byol')) {
            matchesRestriction = true;
            break;
          }
        }
        // Special handling for "BYOL" constraint
        else if (restrictText.includes('byol')) {
          if (serviceName.includes('byol') || service.skuType === 'DATABASE_BYOL') {
            matchesRestriction = true;
            break;
          }
        }
        // Database category check
        else if (restrictText.includes('database') && serviceCategory.includes('database')) {
          matchesRestriction = true;
          break;
        }
      }
      
      if (!matchesRestriction) {
        return {
          allowed: false,
          reason: `Service doesn't match restrictive constraint: ${constraints.restrictive.map(r => r.fullMatch).join(', ')}`
        };
      }
    }

    // Check exclusions
    for (const exclusion of constraints.exclusions) {
      const excludeText = exclusion.instruction.toLowerCase();
      
      if (excludeText.includes('app server') && serviceName.includes('application')) {
        return {
          allowed: false,
          reason: `Service excluded by constraint: ${exclusion.fullMatch}`
        };
      }
    }

    return { allowed: true, reason: 'Service meets all constraints' };
  }
}

// Test the user's specific prompt
const userPrompt = `
--- Infrastructure Requirements from uploaded document ---

Compute Requirements:
- Instances needed: 6
- CPU cores per instance: 4
- Memory per instance: 60 GB
- Instance type: standard

Storage Requirements:
- Block storage: 2136 GB
- Object storage: 500 GB
- File storage: 0 GB

Database Requirements:
- Type: oracle
- Size: large
- Storage: 2136 GB

Network Requirements:
- Load balancer needed: Yes
- Bandwidth: 1 Gbps
- VPN required: No

Summary: Oracle database environment with 6 instances (mix of prod and test), running Oracle 11.2.0.4, total of 12 cores and 180GB RAM across instances. Storage requirements include 712GB per major instance. Production and test environments for EDW, BUSOB, FNC200, and HRB200 systems.

Consider these additional items:
1. Do not consider any app servers.
2. Only Consider Base Oracle Database Service SKU with BYOL
`;

const mockServices = [
  {
    partNumber: 'B89728',
    displayName: 'Database - Base Database Service - BYOL',
    serviceCategory: 'Database',
    skuType: 'DATABASE_BYOL'
  },
  {
    partNumber: 'B109356',
    displayName: 'Oracle Exadata Exascale Database ECPU',
    serviceCategory: 'Database',
    skuType: 'DATABASE_EXADATA'
  },
  {
    partNumber: 'B88317',
    displayName: 'Compute - Standard - E4 - OCPU Hour',
    serviceCategory: 'Compute',
    skuType: 'OCPU'
  },
  {
    partNumber: 'B99999',
    displayName: 'Application Server - WebLogic',
    serviceCategory: 'Compute',
    skuType: 'APPLICATION'
  }
];

console.log('🧪 Testing User Specific Constraint Scenario\n');

const tester = new ConstraintTester();
const constraints = tester.extractUserConstraints(userPrompt);

console.log('📝 User Prompt Summary:');
console.log('- 6 instances × 4 cores each = 24 cores calculated');
console.log('- BUT user explicitly states "total of 12 cores"');
console.log('- Constraint: "Only Consider Base Oracle Database Service SKU with BYOL"');
console.log('- Constraint: "Do not consider any app servers"');

console.log('\n🔍 Detected Constraints:');
console.log(`Restrictive (${constraints.restrictive.length}):`);
constraints.restrictive.forEach(r => console.log(`  • "${r.fullMatch}"`));

console.log(`Exclusions (${constraints.exclusions.length}):`);
constraints.exclusions.forEach(e => console.log(`  • "${e.fullMatch}"`));

console.log(`Specific SKUs (${constraints.specificSkus.length}):`);
constraints.specificSkus.forEach(s => console.log(`  • "${s.sku}" from "${s.fullMatch}"`));

console.log('\n🏷️ Service Validation Results:');
mockServices.forEach(service => {
  const validation = tester.validateServiceAgainstConstraints(service, constraints);
  const status = validation.allowed ? '✅' : '❌';
  const highlight = service.partNumber === 'B89728' ? ' ⭐ (EXPECTED MATCH)' : 
                   service.partNumber === 'B109356' ? ' ❗ (CURRENT WRONG MATCH)' : '';
  
  console.log(`${status} ${service.partNumber} - ${service.displayName}${highlight}`);
  console.log(`    Reason: ${validation.reason}`);
});

console.log('\n📊 Expected Behavior:');
console.log('✅ B89728 should be the ONLY database service included');
console.log('❌ B109356 should be excluded (not Base Database Service)');
console.log('❌ B99999 should be excluded (app server constraint)');
console.log('❌ B88317 should be excluded if only database services requested');

console.log('\n🔢 Core Calculation Issue:');
console.log('Expected: 12 cores total (as explicitly stated in summary)');
console.log('Current: 24 cores (6 instances × 4 cores = miscalculation)');
console.log('Fix: LLM should prioritize explicit totals over calculated values');