const axios = require('axios');

async function testCategoriesAPI() {
    console.log('🧪 Testing Document Categories API');
    console.log('==================================\n');
    
    try {
        console.log('1. Testing categories endpoint...');
        const response = await axios.get('http://localhost:3003/api/documents/categories/list', {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('✅ API Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.categories) {
            console.log('\n2. Analyzing category structure:');
            response.data.categories.forEach((cat, index) => {
                console.log(`   ${index + 1}. ${cat.name}`);
                console.log(`      - ID: ${cat.id}`);
                console.log(`      - Description: ${cat.description}`);
                console.log(`      - User Type: ${cat.user_type}`);
                console.log(`      - Required for KYC: ${cat.required_for_kyc}`);
                console.log(`      - Max Size: ${cat.max_file_size_mb}MB`);
                console.log(`      - Formats: ${cat.allowed_formats?.join(', ')}`);
                console.log('');
            });
            
            console.log('3. Filtering test (USER type):');
            const userCategories = response.data.categories.filter(cat => 
                cat.user_type === 'USER' || cat.user_type === 'BOTH'
            );
            console.log(`   Found ${userCategories.length} USER categories:`);
            userCategories.forEach(cat => console.log(`   - ${cat.name}`));
            
            console.log('\n4. Filtering test (CONTRACTOR type):');
            const contractorCategories = response.data.categories.filter(cat => 
                cat.user_type === 'CONTRACTOR' || cat.user_type === 'BOTH'
            );
            console.log(`   Found ${contractorCategories.length} CONTRACTOR categories:`);
            contractorCategories.forEach(cat => console.log(`   - ${cat.name}`));
        }
        
    } catch (error) {
        console.error('❌ API Request Failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Status Text: ${error.response.statusText}`);
            console.error(`   Response Data:`, error.response.data);
        } else if (error.request) {
            console.error('   No response received from server');
            console.error('   Request details:', error.request.path);
        } else {
            console.error('   Error:', error.message);
        }
        
        console.log('\n💡 Possible issues:');
        console.log('   - Document service not running on port 3003');
        console.log('   - API endpoint path incorrect');
        console.log('   - Authentication middleware blocking request');
        console.log('   - Database connection issues');
    }
}

testCategoriesAPI();