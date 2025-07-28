// Test the redesigned Oracle Cloud BOM Generator system
// Focus on Oracle Base Database Service scenario

const constraintValidator = require('./server/services/constraintValidatorRedesigned');
const ociService = require('./server/services/ociServiceRedesigned');

async function testBaseDBScenario() {
  console.log('🧪 Testing Redesigned System: Oracle Base Database Service Scenario');
  console.log('=' .repeat(70));
  
  // Test Case 1: "only consider Base Database Service"
  console.log('\n📋 Test Case 1: Customer says "only consider Base Database Service"');
  const requirements1 = "We need a database for 100 users. Only consider Base Database Service.";
  
  try {
    // Step 1: Extract constraints
    console.log('\n🔍 Step 1: Extract customer constraints');
    const constraints1 = constraintValidator.extractCustomerConstraints(requirements1);
    console.log('Extracted constraints:', JSON.stringify(constraints1, null, 2));
    
    // Step 2: Get Oracle services
    console.log('\n🔍 Step 2: Get Oracle services');
    const allServices = await ociService.getAllServices();
    console.log(`Found ${allServices.length} Oracle services`);
    
    // Step 3: Find matching services with business intent
    console.log('\n🔍 Step 3: Match services with business intent');
    const mockRequirements = { 
      parsedRequirements: { database: { type: 'oracle', size: 'medium' } },
      userConstraints: constraints1 
    };
    const matchedServices = await ociService.findMatchingServices(mockRequirements);
    console.log(`Matched ${matchedServices.length} services`);
    
    // Display matched services
    console.log('\n📊 Matched Services:');
    matchedServices.forEach(service => {
      console.log(`  ✅ ${service.partNumber}: ${service.displayName}`);
      console.log(`     Business Value: ${service.businessDescription || 'N/A'}`);
      console.log(`     Pricing: $${service.pricing?.unitPrice || 'N/A'}/${service.pricing?.unit || 'N/A'}`);
      if (service.businessMatch) {
        console.log(`     Match Score: ${service.businessMatch.score.toFixed(2)} - ${service.businessMatch.reasons.join('; ')}`);
      }
      console.log('');
    });
    
    // Step 4: Apply constraint filtering
    console.log('\n🔍 Step 4: Apply constraint filtering');
    const filterResult = constraintValidator.filterServicesWithConstraints(allServices, constraints1);
    console.log(`Filter results: ${filterResult.includedServices.length} included, ${filterResult.rejectedServices.length} excluded`);
    
    // Show constraint summary
    console.log('\n📋 Constraint Summary:');
    const summary = constraintValidator.generateConstraintSummary(constraints1);
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('❌ Test Case 1 Failed:', error);
  }
  
  // Test Case 2: Budget-conscious with exclusions
  console.log('\n' + '='.repeat(70));
  console.log('📋 Test Case 2: "Budget-conscious database, no app servers"');
  const requirements2 = "Need a budget-conscious database solution for 50 users. No app servers or compute services.";
  
  try {
    // Extract constraints
    const constraints2 = constraintValidator.extractCustomerConstraints(requirements2);
    console.log('\nExtracted constraints:', JSON.stringify(constraints2, null, 2));
    
    // Test service validation
    console.log('\n🔍 Testing specific services against constraints:');
    const testServices = [
      { partNumber: 'B89728', displayName: 'Database - Base Database Service - BYOL', serviceCategory: 'Database', tier: 'standard' },
      { partNumber: 'B88317', displayName: 'Compute - Standard - E4 - OCPU Hour', serviceCategory: 'Compute', tier: 'standard' },
      { partNumber: 'B89729', displayName: 'Database - Autonomous Database - OCPU Hour', serviceCategory: 'Database', tier: 'premium' }
    ];
    
    testServices.forEach(service => {
      const validation = constraintValidator.validateServiceAgainstCustomerConstraints(service, constraints2);
      console.log(`\n  ${validation.allowed ? '✅' : '❌'} ${service.partNumber}: ${service.displayName}`);
      console.log(`     Validation: ${validation.businessJustification}`);
      console.log(`     Score: ${validation.score.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Test Case 2 Failed:', error);
  }
  
  console.log('\n🎉 Redesigned System Testing Complete!');
  console.log('=' .repeat(70));
}

// Run the test
testBaseDBScenario().catch(console.error);