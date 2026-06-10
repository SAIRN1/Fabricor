const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Layout.tsx', 'utf8');

const dxfFn = `
  const exportDXF = () => {
    const SCALE = 1 / 10; // pixels to inches (10px = 1 inch at default scale)
    let dxf = '0\\nSECTION\\n2\\nHEADER\\n0\\nENDSEC\\n0\\nSECTION\\n2\\nENTITIES\\n';
    // Export shapes as polylines
    shapes.forEach((shape, si) => {
      if (shape.points.length < 2) return;
      dxf += '0\\nLWPOLYLINE\\n8\\nCOUNTERTOP\\n70\\n1\\n';
      dxf += \`90\\n\${shape.points.length}\\n\`;
      shape.points.forEach(pt => {
        const x = ((pt.x - pan.x) * SCALE).toFixed(4);
        const y = (-(pt.y - pan.y) * SCALE).toFixed(4);
        dxf += \`10\\n\${x}\\n20\\n\${y}\\n\`;
      });
    });
    // Export seams as lines
    seams.forEach(seam => {
      const x1 = ((seam.start.x - pan.x) * SCALE).toFixed(4);
      const y1 = (-(seam.start.y - pan.y) * SCALE).toFixed(4);
      const x2 = ((seam.end.x - pan.x) * SCALE).toFixed(4);
      const y2 = (-(seam.end.y - pan.y) * SCALE).toFixed(4);
      dxf += \`0\\nLINE\\n8\\nSEAMS\\n10\\n\${x1}\\n20\\n\${y1}\\n11\\n\${x2}\\n21\\n\${y2}\\n\`;
    });
    // Export cutouts as circles/rectangles
    cutouts.forEach(cutout => {
      const cx = ((cutout.x - pan.x) * SCALE).toFixed(4);
      const cy = (-(cutout.y - pan.y) * SCALE).toFixed(4);
      const w = (cutout.width * SCALE).toFixed(4);
      const h = (cutout.height * SCALE).toFixed(4);
      dxf += \`0\\nLWPOLYLINE\\n8\\nCUTOUTS\\n70\\n1\\n90\\n4\\n\`;
      dxf += \`10\\n\${cx}\\n20\\n\${cy}\\n\`;
      dxf += \`10\\n\${(parseFloat(cx)+parseFloat(w)).toFixed(4)}\\n20\\n\${cy}\\n\`;
      dxf += \`10\\n\${(parseFloat(cx)+parseFloat(w)).toFixed(4)}\\n20\\n\${(parseFloat(cy)-parseFloat(h)).toFixed(4)}\\n\`;
      dxf += \`10\\n\${cx}\\n20\\n\${(parseFloat(cy)-parseFloat(h)).toFixed(4)}\\n\`;
    });
    dxf += '0\\nENDSEC\\n0\\nEOF\\n';
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`\${jobName || 'layout'}-stonedesk.dxf\`;
    link.click();
  };
`;

// Add after exportPDF function
c = c.replace('  const exportPDF = () => {', dxfFn + '\n  const exportPDF = () => {');

// Add DXF button next to Export PNG button
c = c.replace(
  '<button onClick={exportPDF}',
  '<button onClick={exportDXF} className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2 text-xs font-medium"><Download size={14} /> Export DXF</button>\n          <button onClick={exportPDF}'
);

fs.writeFileSync('client/src/pages/Layout.tsx', c);
console.log('done');
