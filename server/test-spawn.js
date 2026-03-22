const { execFile } = require('child_process');

function execWithInput(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
  });
}

async function test() {
  try {
    const { stdout, stderr } = await execWithInput('python', ['-c', 'name = input(); print("Hello " + name)'], {
      input: 'World\n',
      timeout: 5000
    });
    console.log("Success:", stdout);
  } catch (error) {
    console.log("Error object keys:", Object.keys(error));
    console.log("Error message:", error.message);
  }
}
test();
