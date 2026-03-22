export const submitCode = async (code, language, input = '') => {
  try {
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        language: language,
        input: input
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    // Format output
    let output = '';
    
    if (result.output) {
      output = result.output;
    }
    
    if (result.error && result.error.trim()) {
      output += (output ? '\n' : '') + result.error;
    }

    return {
      success: result.success,
      output: output || 'Program executed successfully',
      status: result.success ? 'Execution successful' : 'Execution error',
      exitCode: result.exitCode || 0
    };
  } catch (error) {
    console.error('Compiler error:', error);
    return {
      success: false,
      output: '',
      status: 'Error',
      error: error.message,
      exitCode: -1
    };
  }
};
