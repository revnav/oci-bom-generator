#!/usr/bin/env node

// Simple test script to verify constraint detection
const llmService = require('./server/services/llmService');

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

console.log('🧪 Testing User Constraint Detection\n');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`Requirements: "${testCase.requirements}"`);
  
  const constraints = llmService.extractUserConstraints(testCase.requirements);
  
  console.log('Detected Constraints:');
  console.log(`  - Restrictive: ${constraints.restrictive.length} items`);
  constraints.restrictive.forEach(r => console.log(`    • "${r.fullMatch}"`));
  
  console.log(`  - Exclusions: ${constraints.exclusions.length} items`);
  constraints.exclusions.forEach(e => console.log(`    • "${e.fullMatch}"`));
  
  console.log(`  - Specific SKUs: ${constraints.specificSkus.length} items`);
  constraints.specificSkus.forEach(s => console.log(`    • "${s.sku}" from "${s.fullMatch}"`));
  
  console.log('---');
});

console.log('\n✅ Constraint detection test completed');