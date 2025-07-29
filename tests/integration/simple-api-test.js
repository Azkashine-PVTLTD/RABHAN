const http = require('http');

// Simple HTTP request without axios to test basic connectivity
function testEndpoint() {
    console.log('🧪 Testing Document Service Connectivity');
    console.log('========================================\n');
    
    // First test basic health check
    console.log('1. Testing health endpoint...');
    const healthOptions = {
        hostname: 'localhost',
        port: 3003,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };
    
    const healthReq = http.request(healthOptions, (res) => {
        console.log(`✅ Health Check - Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('   Service is running!');
                console.log('   Response:', JSON.parse(data));
                testCategoriesEndpoint();
            } else {
                console.log('❌ Health check failed');
            }
        });
    });
    
    healthReq.on('error', (error) => {
        console.log('❌ Health Check Failed:', error.message);
        console.log('   Document service is not running on port 3003');
    });
    
    healthReq.on('timeout', () => {
        console.log('❌ Health Check Timeout');
        healthReq.destroy();
    });
    
    healthReq.end();
}

function testCategoriesEndpoint() {
    console.log('\n2. Testing categories endpoint...');
    const categoryOptions = {
        hostname: 'localhost',
        port: 3003,
        path: '/api/documents/categories/list',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
        },
        timeout: 10000
    };
    
    const categoryReq = http.request(categoryOptions, (res) => {
        console.log(`   Categories API - Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (res.statusCode === 200 && response.categories) {
                    console.log('✅ Categories API Success!');
                    console.log(`   Found ${response.categories.length} categories`);
                    
                    // Test filtering logic
                    const userCategories = response.categories.filter(cat => 
                        cat.user_type === 'USER' || cat.user_type === 'BOTH'
                    );
                    const contractorCategories = response.categories.filter(cat => 
                        cat.user_type === 'CONTRACTOR' || cat.user_type === 'BOTH'
                    );
                    
                    console.log(`   USER categories: ${userCategories.length}`);
                    userCategories.forEach(cat => console.log(`     - ${cat.name}`));
                    
                    console.log(`   CONTRACTOR categories: ${contractorCategories.length}`);
                    contractorCategories.forEach(cat => console.log(`     - ${cat.name}`));
                    
                    if (userCategories.length === 0) {
                        console.log('❌ No USER categories found - this is the issue!');
                    }
                } else {
                    console.log('❌ Categories API Error:', response);
                }
            } catch (error) {
                console.log('❌ Failed to parse categories response:', data);
            }
        });
    });
    
    categoryReq.on('error', (error) => {
        console.log('❌ Categories API Failed:', error.message);
    });
    
    categoryReq.on('timeout', () => {
        console.log('❌ Categories API Timeout');
        categoryReq.destroy();
    });
    
    categoryReq.end();
}

testEndpoint();