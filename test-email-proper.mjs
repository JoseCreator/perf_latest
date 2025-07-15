// Test script following the project's API pattern
const API_BASE_URL = 'http://localhost:4000';

const emailApi = {
  checkStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/email/status`);
    if (!response.ok) throw new Error('Failed to check email status');
    return response.json();
  },

  sendEmail: async (emailData) => {
    const response = await fetch(`${API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    if (!response.ok) throw new Error('Failed to send email');
    return response.json();
  }
};

async function testEmailFunctionality() {
    console.log('🚀 Testing Email API using project structure...\n');
    
    try {
        // Test 1: Check email status
        console.log('1. Testing email status...');
        const status = await emailApi.checkStatus();
        console.log('✅ Email Status:', status);
        console.log(`   API Key Configured: ${status.apiKeyConfigured ? '✅' : '❌'}`);
        
        // Test 2: Try sending a test email
        console.log('\n2. Testing email send...');
        const emailData = {
            to: 'test@example.com',
            from: 'noreply@yourdomain.com', // Replace with verified sender
            subject: 'Test Email from SendGrid API',
            text: 'This is a test email sent from your application using SendGrid!'
        };
        
        const result = await emailApi.sendEmail(emailData);
        console.log('✅ Email Send Result:', result);
        
    } catch (error) {
        console.error('❌ Email Test Error:', error.message);
        
        // If it's a network error, provide debugging info
        if (error.message.includes('fetch')) {
            console.log('\n🔧 Debugging Info:');
            console.log('Make sure your backend is running on the correct port');
            console.log('Check if the API endpoints are accessible');
        }
    }
}

testEmailFunctionality();
