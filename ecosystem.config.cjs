module.exports = {
    apps: [{
      name: 'backend',
      script: './dist/index.js',
      interpreter: 'bun',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: require('dotenv').config().parsed
    }]
  };