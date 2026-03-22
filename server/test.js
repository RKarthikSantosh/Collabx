const testCompilerJS = async () => {
  try {
    console.log('Testing JavaScript compiler...');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'console.log("Hello from JavaScript!");\nconsole.log(5 + 3);',
        language: 'javascript'
      })
    });

    const data = await response.json();
    console.log('JavaScript Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
};

const testCompilerPython = async () => {
  try {
    console.log('\nTesting Python compiler...');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'print("Hello from Python!")\nprint(5 + 3)',
        language: 'python'
      })
    });

    const data = await response.json();
    console.log('Python Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
};

const testCompilerJava = async () => {
  try {
    console.log('\nTesting Java compiler...');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'System.out.println("Hello from Java!");\nSystem.out.println(5 + 3);',
        language: 'java'
      })
    });

    const data = await response.json();
    console.log('Java Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
};

testCompilerJS();
setTimeout(() => testCompilerPython(), 2000);
setTimeout(() => testCompilerJava(), 4000);
