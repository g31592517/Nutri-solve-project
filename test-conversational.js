const fetch = require('node-fetch');

async function testConversational() {
  console.log('🧪 Testing Conversational Response Format');
  console.log('==========================================');
  
  const testQuery = 'what meals are recommended for breakfast';
  console.log(`Query: "${testQuery}"`);
  
  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        stream: false
      }),
    });
    
    const data = await response.json();
    
    console.log('\n📝 Response:');
    console.log('='.repeat(50));
    console.log(data.response);
    console.log('='.repeat(50));
    
    // Check if response is conversational (not JSON)
    const isJSON = data.response.trim().startsWith('{') || data.response.includes('"days":');
    const isConversational = !isJSON && data.response.length > 20;
    
    console.log(`\n✅ Format: ${isConversational ? 'Conversational ✓' : 'JSON/Short ✗'}`);
    console.log(`📊 Length: ${data.response.length} characters`);
    console.log(`⏱️  Time: ${data.ms}ms`);
    console.log(`💾 Cached: ${data.cached ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConversational();
