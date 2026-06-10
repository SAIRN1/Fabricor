const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const locRoutes = `
app.get("/api/locations", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM locations WHERE user_id = \${userId} AND active = true ORDER BY created_at ASC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/locations", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const shopRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${userId}\`);
    const shopId = (shopRes.rows[0] as any)?.shop_id;
    const { name, address, city, state, phone, managerName } = req.body;
    const result = await db.execute(sql\`INSERT INTO locations (user_id, shop_id, name, address, city, state, phone, manager_name) VALUES (\${userId}, \${shopId||null}, \${name}, \${address||null}, \${city||null}, \${state||null}, \${phone||null}, \${managerName||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/locations/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`UPDATE locations SET active = false WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(1086, 0, locRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
