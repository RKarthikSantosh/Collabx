// Complex code execution tests

const testComplexJavaScript = async () => {
  try {
    console.log('=== Testing Complex JavaScript ===');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
// Fibonacci sequence
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
const sum = doubled.reduce((a, b) => a + b, 0);
console.log("\\nDoubled numbers:", doubled);
console.log("Sum:", sum);
`,
        language: 'javascript'
      })
    });
    const data = await response.json();
    console.log('Result:', data.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Output:\\n', data.output);
    if (data.error) console.log('Error:', data.error);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

const testComplexPython = async () => {
  try {
    console.log('\\n=== Testing Complex Python ===');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
# Prime number finder
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

print("Prime numbers up to 30:")
primes = [n for n in range(30) if is_prime(n)]
print(primes)

# List comprehension examples
squares = [x**2 for x in range(1, 6)]
print("\\nSquares:", squares)

# Dictionary operations
person = {"name": "Alice", "age": 25, "city": "NYC"}
print("\\nPerson:", person)
print("Name:", person["name"])
`,
        language: 'python'
      })
    });
    const data = await response.json();
    console.log('Result:', data.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Output:\\n', data.output);
    if (data.error) console.log('Error:', data.error);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

const testComplexJava = async () => {
  try {
    console.log('\\n=== Testing Complex Java ===');
    const response = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
// Calculator class
class Calculator {
  public static int add(int a, int b) {
    return a + b;
  }
  
  public static int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
}

System.out.println("Addition: 5 + 3 = " + Calculator.add(5, 3));
System.out.println("\\nFactorial sequence:");
for (int i = 1; i <= 6; i++) {
  System.out.println("factorial(" + i + ") = " + Calculator.factorial(i));
}
`,
        language: 'java'
      })
    });
    const data = await response.json();
    console.log('Result:', data.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Output:\\n', data.output);
    if (data.error) console.log('Error:', data.error);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

// Run tests
testComplexJavaScript();
setTimeout(() => testComplexPython(), 3000);
setTimeout(() => testComplexJava(), 6000);
