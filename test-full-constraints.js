#!/usr/bin/env node

// Full integration test for constraint-aware BOM generation
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const llmService = require('./server/services/llmService');
const ociService = require('./server/services/ociService');

async function testConstraintAwareBOM() {
  console.log('🧪 Testing Full Constraint-Aware BOM Generation\n');

  // Test case with specific constraints
  const testRequirements = "Generate BOM for Oracle database deployment, only consider compute services, do not include any storage or networking services";
  
  console.log(`📝 Test Requirements: "${testRequirements}"`);
  console.log('\n1️⃣ Analyzing requirements with constraint detection...');
  
  try {
    // Step 1: Analyze requirements (this should detect constraints)
    const analysis = await llmService.analyzeRequirements(testRequirements, 'claude');
    
    console.log('✅ Requirements analysis completed');
    console.log('📋 Parsed Requirements:', JSON.stringify(analysis.parsedRequirements, null, 2));
    
    if (analysis.userConstraints) {
      console.log('🔒 Detected User Constraints:', JSON.stringify(analysis.userConstraints, null, 2));
    }
    
    if (analysis.needsFollowUp) {
      console.log('❓ Follow-up questions needed:', analysis.followUpQuestions);
      return;
    }
    
    // Step 2: Get OCI services
    console.log('\n2️⃣ Fetching OCI services...');
    const ociServices = await ociService.findMatchingServices(analysis.parsedRequirements);
    console.log(`✅ Found ${ociServices.length} matching OCI services`);
    
    // Step 3: Generate BOM with constraints
    console.log('\n3️⃣ Generating BOM with constraint enforcement...');
    const bomData = await llmService.generateBOM(analysis.parsedRequirements, ociServices, 'claude');
    
    console.log('✅ BOM generation completed');
    console.log(`📊 Generated BOM with ${bomData.items?.length || 0} items`);
    
    if (bomData.constraintCompliance) {
      console.log('\n📈 Constraint Compliance Report:');
      console.log(`  - Original items considered: ${bomData.constraintCompliance.originalItemCount}`);
      console.log(`  - Final items included: ${bomData.constraintCompliance.validatedItemCount}`);
      console.log(`  - Items rejected: ${bomData.constraintCompliance.rejectedItemCount}`);
      
      if (bomData.constraintCompliance.rejectedItems.length > 0) {
        console.log('  - Rejected items:');
        bomData.constraintCompliance.rejectedItems.forEach(item => {
          console.log(`    • ${item.sku}: ${item.reason}`);
        });
      }
    }
    
    console.log('\n📋 Final BOM Items:');
    bomData.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.sku} - ${item.description} (${item.category})`);
      console.log(`     Quantity: ${item.quantity}, Price: $${item.unitPrice}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testConstraintAwareBOM().then(() => {
  console.log('\n✅ Full constraint-aware BOM generation test completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error.message);
});