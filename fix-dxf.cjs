const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Layout.tsx', 'utf8');
c = c.replace(
  `    seams.forEach(seam => {
      const x1 = ((seam.start.x - pan.x) * SCALE).toFixed(4);
      const y1 = (-(seam.start.y - pan.y) * SCALE).toFixed(4);
      const x2 = ((seam.end.x - pan.x) * SCALE).toFixed(4);
      const y2 = (-(seam.end.y - pan.y) * SCALE).toFixed(4);`,
  `    seams.forEach(seam => {
      const x1 = ((seam.x1 - pan.x) * SCALE).toFixed(4);
      const y1 = (-(seam.y1 - pan.y) * SCALE).toFixed(4);
      const x2 = ((seam.x2 - pan.x) * SCALE).toFixed(4);
      const y2 = (-(seam.y2 - pan.y) * SCALE).toFixed(4);`
);
fs.writeFileSync('client/src/pages/Layout.tsx', c);
console.log('done');
