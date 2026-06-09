const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const notesRoutes = `
app.get("/api/jobs/:id/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM job_notes WHERE job_id = \${req.params.id} AND user_id = \${userId} ORDER BY created_at ASC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/jobs/:id/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { note, author } = req.body;
    const result = await db.execute(sql\`INSERT INTO job_notes (user_id, job_id, note, author) VALUES (\${userId}, \${req.params.id}, \${note}, \${author || 'Shop'}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: "Failed to save note" }); }
});
app.delete("/api/jobs/:id/notes/:noteId", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`DELETE FROM job_notes WHERE id = \${req.params.noteId} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete note" }); }
});
`;
const lines = c.split('\n');
lines.splice(791, 0, notesRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
