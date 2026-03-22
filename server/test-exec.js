const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

async function test() {
  try {
    const { stdout, stderr } = await execFileAsync('python', ['-c', 'name = input(); print("Hello " + name)'], {
      input: 'World'
    });
    console.log("Success:", stdout);
  } catch (error) {
    console.log("Error object keys:", Object.keys(error));
    console.log("Error stdout:", error.stdout);
    console.log("Error stderr:", error.stderr);
    console.log("Error message:", error.message);
  }
}
test();
