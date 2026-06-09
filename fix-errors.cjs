const fs = require('fs');

// Fix 1: Jobs.tsx duplicate property
let jobs = fs.readFileSync('client/src/pages/Jobs.tsx', 'utf8');
jobs = jobs.replace(
  /onSuccess: async \(data: any, variables: any\) => \{[\s\S]*?\},\s*onSuccess:/,
  'onSuccess:'
);
fs.writeFileSync('client/src/pages/Jobs.tsx', jobs);
console.log('Jobs fixed');

// Fix 2 & 3: server/index.ts - Stripe API version and updatedAt
let server = fs.readFileSync('server/index.ts', 'utf8');
server = server.replace('"2024-06-20"', '"2026-05-27.dahlia"');
server = server.replace('{ shopName, email: adminEmail || undefined, updatedAt: new Date() }', '{ shopName, email: adminEmail || undefined }');
fs.writeFileSync('server/index.ts', server);
console.log('Server fixed');
