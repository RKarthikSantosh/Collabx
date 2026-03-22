const axios = require('axios');

const testPiston = async () => {
  try {
    console.log('Testing Piston API...');
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'javascript',
      version: '18.15.0',
      files: [
        {
          name: 'main.js',
          content: 'console.log("Hello from Piston!");'
        }
      ]
    }, {
      timeout: 10000
    });

    console.log('Piston Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
};

testPiston();
