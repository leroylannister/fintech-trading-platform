// tests/setup/create-directories.js
const fs = require('fs');
const path = require('path');

const directories = [
  'cypress/e2e',
  'cypress/fixtures',
  'cypress/support',
  'cypress/screenshots',
  'cypress/videos',
  'postman',
  'data',
  'data-driven',
  'performance',
  'security',
  'reports',
  'unit',
  'integration',
  'setup'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('\n✅ All directories created successfully!');