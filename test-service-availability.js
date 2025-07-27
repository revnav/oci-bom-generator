#!/usr/bin/env node

// Test OCI service availability and matching
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const ociService = require('./server/services/ociService');

async function testServiceAvailability() {
  console.log('🧪 Testing OCI Service Availability\n');

  try {
    // Test 1: Get all services
    console.log('1️⃣ Testing getAllServices()...');
    const allServices = await ociService.getAllServices();
    console.log(`✅ Retrieved ${allServices.length} total services`);
    
    if (allServices.length > 0) {
      console.log('📋 Sample services:');
      allServices.slice(0, 3).forEach(service => {
        console.log(`  - ${service.partNumber}: ${service.displayName} (${service.serviceCategory})`);
        console.log(`    Pricing: ${service.pricing ? 'Available' : 'Missing'}`);
      });
    }

    // Test 2: Test service matching with simple requirements
    console.log('\n2️⃣ Testing findMatchingServices() with basic requirements...');
    const testRequirements = {
      compute: { instances: 2, cores_per_instance: 4, memory_per_instance_gb: 16 },
      storage: { block_storage_gb: 100 },
      database: { type: "oracle", size: "medium" }
    };
    
    const matchedServices = await ociService.findMatchingServices(testRequirements);
    console.log(`✅ Found ${matchedServices.length} matching services`);
    
    if (matchedServices.length > 0) {
      console.log('📋 Matched services:');
      matchedServices.slice(0, 5).forEach(service => {
        console.log(`  - ${service.partNumber}: ${service.displayName} (${service.serviceCategory})`);
        console.log(`    Pricing: $${service.pricing?.unitPrice || 'N/A'}/${service.pricing?.unit || 'N/A'}`);
        console.log(`    Relevance: ${service.relevanceScore}`);
      });
    } else {
      console.log('❌ No services matched - this explains the empty BOM issue!');
    }

    // Test 3: Test service matching with constraint requirements
    console.log('\n3️⃣ Testing findMatchingServices() with constrained requirements...');
    const constrainedRequirements = {
      compute: { instances: 1, cores_per_instance: 2 },
      summary: "only compute services, no storage or networking"
    };
    
    const constrainedServices = await ociService.findMatchingServices(constrainedRequirements);
    console.log(`✅ Found ${constrainedServices.length} constrained services`);
    
    if (constrainedServices.length > 0) {
      console.log('📋 Constrained services:');
      constrainedServices.forEach(service => {
        console.log(`  - ${service.partNumber}: ${service.displayName} (${service.serviceCategory})`);
      });
    }

    console.log('\n✅ Service availability test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testServiceAvailability();