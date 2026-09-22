const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distFile = path.join(__dirname, 'dist', 'index.js');

if (fs.existsSync(distFile)) {
  require(distFile);
} else {
  console.log('⚡ dist/index.js not found, compiling TypeScript...');
  try {
    execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
    require(distFile);
  } catch (err) {
    console.error('Failed to compile with tsc, falling back to tsx runner...', err);
    try {
      require('tsx/cjs');
      require(path.join(__dirname, 'src', 'index.ts'));
    } catch (tsxErr) {
      console.error('Fatal startup error:', tsxErr);
      process.exit(1);
    }
  }
}
