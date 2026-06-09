const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Jobs.tsx', 'utf8');
// Add import
c = c.replace(
  'import PhotoUpload from "./../components/PhotoUpload";',
  'import PhotoUpload from "./../components/PhotoUpload";\nimport JobNotes from "./../components/JobNotes";'
);
// Add JobNotes after PhotoUpload in job detail panel
c = c.replace(
  '{selected && <PhotoUpload jobId={selected.id} />}',
  '{selected && <PhotoUpload jobId={selected.id} />}\n              {selected && <JobNotes jobId={selected.id} />}'
);
fs.writeFileSync('client/src/pages/Jobs.tsx', c);
console.log('done, length:', c.length);
