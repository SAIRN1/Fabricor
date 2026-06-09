const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Jobs.tsx', 'utf8');

// Add printPhotoReport function before the return statement
c = c.replace(
  '  return (',
  `  const printPhotoReport = async () => {
    if (!selected) return;
    const photos = await fetch(\`/api/jobs/\${selected.id}/photos\`, { credentials: "include" }).then(r => r.json());
    const win = window.open('', '_blank');
    if (!win) return;
    const photoHtml = photos.length === 0 ? '<p style="color:#999;">No photos attached to this job.</p>' :
      photos.map((p: any) => \`<div style="margin-bottom:16px;break-inside:avoid;">
        <img src="\${p.dataUrl}" style="width:100%;max-width:300px;border-radius:8px;border:1px solid #eee;" />
        <div style="font-size:11px;color:#666;margin-top:4px;text-transform:capitalize;">\${p.photo_type} · \${new Date(p.created_at).toLocaleDateString()}</div>
        \${p.caption ? \`<div style="font-size:12px;color:#333;">\${p.caption}</div>\` : ''}
      </div>\`).join('');
    win.document.write(\`<!DOCTYPE html><html><head><title>Photo Report - \${selected.jobName}</title>
    <style>body{margin:0;padding:32px;font-family:Arial,sans-serif;}
    .header{border-bottom:2px solid #f59e0b;padding-bottom:16px;margin-bottom:24px;}
    .title{font-size:24px;font-weight:bold;color:#111;}
    .meta{font-size:13px;color:#666;margin-top:4px;}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
    @media print{body{padding:16px;}}
    </style></head><body>
    <div class="header">
      <div class="title">Photo Report — \${selected.jobName}</div>
      <div class="meta">Job #\${selected.jobNumber} · \${selected.jobCity || ''} \${selected.jobState || ''} · \${selected.stoneType || ''} · Generated \${new Date().toLocaleDateString()}</div>
    </div>
    <div class="grid">\${photoHtml}</div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>\`);
    win.document.close();
  };

  return (`
);

// Add photo report button next to Get Signature button
c = c.replace(
  '<button onClick={() => setShowSig(true)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm"><PenLine size={14} /> Get Signature</button>',
  '<button onClick={() => setShowSig(true)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm"><PenLine size={14} /> Get Signature</button>\n              <button onClick={printPhotoReport} className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm px-4"><Download size={14} /> Photo Report</button>'
);

fs.writeFileSync('client/src/pages/Jobs.tsx', c);
console.log('done, length:', c.length);
