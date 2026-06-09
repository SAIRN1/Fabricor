const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const leadsRoutes = `
app.get("/api/leads", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM leads WHERE user_id = \${userId} ORDER BY created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/leads", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { firstName, lastName, email, phone, city, state, projectType, stoneType, estimatedSqft, estimatedValue, source, status, notes, followUpDate } = req.body;
    const result = await db.execute(sql\`INSERT INTO leads (user_id, first_name, last_name, email, phone, city, state, project_type, stone_type, estimated_sqft, estimated_value, source, status, notes, follow_up_date) VALUES (\${userId}, \${firstName}, \${lastName}, \${email||null}, \${phone||null}, \${city||null}, \${state||null}, \${projectType}, \${stoneType}, \${estimatedSqft||null}, \${estimatedValue||null}, \${source}, \${status||'new'}, \${notes||null}, \${followUpDate||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { status, notes, followUpDate } = req.body;
    const result = await db.execute(sql\`UPDATE leads SET status = COALESCE(\${status||null}, status), notes = COALESCE(\${notes||null}, notes), follow_up_date = COALESCE(\${followUpDate||null}::date, follow_up_date), updated_at = NOW() WHERE id = \${req.params.id} AND user_id = \${userId} RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`DELETE FROM leads WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(921, 0, leadsRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
