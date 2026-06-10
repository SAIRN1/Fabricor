const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const designerRoutes = `
app.get("/api/designers", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM designer_accounts WHERE user_id = \${userId} ORDER BY created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/designers", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const shopRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${userId}\`);
    const shopId = (shopRes.rows[0] as any)?.shop_id;
    const { contactName, companyName, email, phone } = req.body;
    const accessCode = 'D' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const result = await db.execute(sql\`INSERT INTO designer_accounts (user_id, shop_id, contact_name, company_name, email, phone, access_code) VALUES (\${userId}, \${shopId||null}, \${contactName}, \${companyName||null}, \${email||null}, \${phone||null}, \${accessCode}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/designers/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`UPDATE designer_accounts SET active = false WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(1112, 0, designerRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
