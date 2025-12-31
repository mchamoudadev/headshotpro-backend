const fs = require('fs');
const path = require('path');

// Read and parse .env file manually
const envPath = path.join(__dirname, '.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envConfig[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

console.log('Loaded env vars:', Object.keys(envConfig)); // Debug log

module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/index.js',
    interpreter: 'bun',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: envConfig,
    cwd: __dirname  // Add this to ensure correct working directory
  }]
};