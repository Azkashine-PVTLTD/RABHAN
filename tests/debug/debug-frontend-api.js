const axios = require('axios');

// Simulate exactly what the frontend is doing
async function debugFrontendAPI() {
    console.log('🔍 Debugging Frontend Document Categories API Calls');
    console.log('==================================================\n');
    
    try {
        // 1. Test the categories endpoint the frontend is calling
        console.log('1. Testing categories endpoint (as frontend calls it)...');
        const categoriesResponse = await axios.get('http://localhost:3003/api/documents/categories/list', {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Categories API Response:', categoriesResponse.status);
        console.log('   Categories found:', categoriesResponse.data.categories?.length || 0);
        
        if (categoriesResponse.data.categories) {
            // 2. Simulate the frontend filtering logic
            console.log('\n2. Simulating frontend filtering logic...');
            
            const userType = 'USER'; // Simulating USER type
            console.log(`   Filtering for userType: ${userType}`);
            
            // This is exactly what KYCProgressTracker does at line 514-516
            const relevantCategories = categoriesResponse.data.categories.filter(cat => 
                cat.user_type === userType || cat.user_type === 'BOTH'
            );
            
            console.log(`✅ Relevant categories found: ${relevantCategories.length}`);
            relevantCategories.forEach(cat => {
                console.log(`   - ${cat.name} (${cat.user_type})`);
                console.log(`     Required for KYC: ${cat.required_for_kyc}`);
                console.log(`     ID: ${cat.id}`);
            });
            
            // 3. Check the required_for_kyc filtering
            console.log('\n3. Filtering for required KYC documents...');
            const requiredCategories = relevantCategories.filter(cat => cat.required_for_kyc);
            console.log(`✅ Required KYC categories: ${requiredCategories.length}`);
            
            if (requiredCategories.length === 0) {
                console.log('❌ NO REQUIRED CATEGORIES FOUND!');
                console.log('   This explains why no documents show in the frontend.');
                console.log('   Issue: required_for_kyc field is not true for any categories');
                
                // Show what the required_for_kyc values actually are
                console.log('\n   Checking required_for_kyc values:');
                relevantCategories.forEach(cat => {
                    console.log(`     ${cat.name}: required_for_kyc = ${cat.required_for_kyc} (${typeof cat.required_for_kyc})`);
                });
            } else {
                requiredCategories.forEach(cat => {
                    console.log(`   - ${cat.name} (required)`);
                });
            }
            
            // 4. Test documents API call
            console.log('\n4. Testing documents API call...');
            try {
                const documentsResponse = await axios.get('http://localhost:3003/api/documents/?userId=1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0&limit=100', {
                    headers: {
                        'Authorization': 'Bearer test-token',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log('✅ Documents API Response:', documentsResponse.status);
                console.log('   Documents found:', documentsResponse.data.documents?.length || 0);
                
                if (documentsResponse.data.documents) {
                    documentsResponse.data.documents.forEach(doc => {
                        console.log(`   - ${doc.original_filename} (Category: ${doc.category_id})`);
                    });
                }
            } catch (error) {
                console.log('❌ Documents API Failed:', error.response?.data || error.message);
            }
            
        }
        
    } catch (error) {
        console.error('❌ Categories API Request Failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Status Text: ${error.response.statusText}`);
            console.error(`   Response Data:`, error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
    }
}

debugFrontendAPI();