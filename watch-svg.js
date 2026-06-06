const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const svgDir = path.join(__dirname, 'assets', 'svg'); // Adjust if your SVGs are elsewhere

// Ensure the directory exists
require('fs').mkdirSync(svgDir, { recursive: true });

console.log(`Watching for SVGs in: ${svgDir}`);

chokidar.watch(svgDir, { ignoreInitial: true })
  .on('add', (filePath) => {
    if (filePath.endsWith('.svg')) {
      console.log(`SVG added: ${filePath}. Running conversion...`);
      exec('npm run svg:convert', (err, stdout, stderr) => {
        if (err) {
          console.error('Conversion failed:', stderr);
        } else {
          console.log('Conversion complete:', stdout);
        }
      });
    }
  });