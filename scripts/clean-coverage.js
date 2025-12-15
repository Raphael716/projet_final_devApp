#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'coverage'),
  path.join(__dirname, '..', 'backend', 'coverage'),
  path.join(__dirname, '..', 'SPL', 'coverage'),
  path.join(__dirname, '..', '_sokrates', 'reports'),
];

for (const t of targets) {
  try {
    if (fs.existsSync(t)) {
      console.log('Removing', t);
      fs.rmSync(t, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Failed to remove', t, e.message);
  }
}

console.log('Clean coverage complete.');
