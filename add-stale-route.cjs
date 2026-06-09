const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const staleRoute = `
app.get("/api/jobs/stale", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`
      SELECT id, job_name, job_number, stage,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage
      FROM jobs
      WHERE user_id = \${userId}
        AND stage != 'complete'
        AND stage != 'inquiry'
        AND EXTRACT(DAY FROM NOW() - updated_at) > 5
      ORDER BY days_in_stage DESC
      LIMIT 10
    \`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
`;
const lines = c.split('\n');
lines.splice(815, 0, staleRoute);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
