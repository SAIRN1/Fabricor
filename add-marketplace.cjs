const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const marketRoutes = `
app.get("/api/marketplace", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(sql\`SELECT * FROM marketplace_listings WHERE status = 'active' AND expires_at > NOW() ORDER BY created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/marketplace", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const shopRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${userId}\`);
    const shopId = (shopRes.rows[0] as any)?.shop_id;
    const { listingType, title, description, stoneType, color, quantity, unit, price, locationCity, locationState, contactEmail, contactPhone } = req.body;
    const result = await db.execute(sql\`INSERT INTO marketplace_listings (user_id, shop_id, listing_type, title, description, stone_type, color, quantity, unit, price, location_city, location_state, contact_email, contact_phone) VALUES (\${userId}, \${shopId||null}, \${listingType}, \${title}, \${description||null}, \${stoneType||null}, \${color||null}, \${quantity||null}, \${unit||null}, \${price||null}, \${locationCity||null}, \${locationState||null}, \${contactEmail||null}, \${contactPhone||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/marketplace/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`UPDATE marketplace_listings SET status = 'removed' WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(1139, 0, marketRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('server done');
