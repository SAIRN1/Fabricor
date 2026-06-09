const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const silicaRoutes = `
app.get("/api/silica", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM silica_records WHERE user_id = \${userId} ORDER BY training_date DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/silica", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { workerName, trainingType, trainingDate, trainer, notes, certified } = req.body;
    const result = await db.execute(sql\`INSERT INTO silica_records (user_id, worker_name, training_type, training_date, trainer, notes, certified) VALUES (\${userId}, \${workerName}, \${trainingType}, \${trainingDate}, \${trainer}, \${notes}, \${certified}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: "Failed to save record" }); }
});
app.delete("/api/silica/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`DELETE FROM silica_records WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete record" }); }
});
`;
c = c.replace('app.listen(PORT,', silicaRoutes + '\napp.listen(PORT,');
fs.writeFileSync('server/index.ts', c);
console.log('done');
