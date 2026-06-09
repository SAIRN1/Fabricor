const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Jobs.tsx', 'utf8');
c = c.replace(
  'import { Plus, X, Briefcase, ChevronRight, PenLine } from "lucide-react";',
  'import { Plus, X, Briefcase, ChevronRight, PenLine, Download } from "lucide-react";'
);
fs.writeFileSync('client/src/pages/Jobs.tsx', c);
console.log('done');
