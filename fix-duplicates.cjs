const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// Remove duplicate Suppliers import
const lines = c.split('\n');
const seen = new Set();
const deduped = lines.filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('import ') && trimmed.includes('from ')) {
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
  }
  return true;
});
c = deduped.join('\n');

// Fix duplicate lucide icons - find the lucide import line and deduplicate icons
c = c.replace(/import \{([^}]+)\} from "lucide-react";/, (match, icons) => {
  const iconList = icons.split(',').map(i => i.trim()).filter(Boolean);
  const unique = [...new Set(iconList)];
  return `import { ${unique.join(', ')} } from "lucide-react";`;
});

fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
