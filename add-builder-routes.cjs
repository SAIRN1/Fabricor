const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const builderRoutes = `
// ── BUILDER PORTAL ROUTES ─────────────────────────────────────
app.get("/api/builders", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM builder_accounts WHERE user_id = \${userId} ORDER BY created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/builders", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const shopRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${userId}\`);
    const shopId = (shopRes.rows[0] as any)?.shop_id;
    const { companyName, contactName, email, phone, city, state } = req.body;
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const result = await db.execute(sql\`INSERT INTO builder_accounts (user_id, shop_id, company_name, contact_name, email, phone, city, state, access_code) VALUES (\${userId}, \${shopId||null}, \${companyName}, \${contactName||null}, \${email||null}, \${phone||null}, \${city||null}, \${state||null}, \${accessCode}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/builder-orders", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT bo.*, ba.company_name as builder_name FROM builder_orders bo LEFT JOIN builder_accounts ba ON bo.builder_id = ba.id WHERE bo.user_id = \${userId} ORDER BY bo.created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.patch("/api/builder-orders/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { status } = req.body;
    const result = await db.execute(sql\`UPDATE builder_orders SET status = \${status}, updated_at = NOW() WHERE id = \${req.params.id} AND user_id = \${userId} RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
// Public builder portal routes
app.get("/api/builder-portal/:code", async (req, res) => {
  try {
    const result = await db.execute(sql\`SELECT ba.*, s.name as shop_name FROM builder_accounts ba LEFT JOIN shops s ON ba.shop_id = s.id WHERE ba.access_code = \${req.params.code} AND ba.active = true\`);
    if (!result.rows[0]) return res.json({ error: "Invalid code" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/builder-portal/:code/orders", async (req, res) => {
  try {
    const builderRes = await db.execute(sql\`SELECT id FROM builder_accounts WHERE access_code = \${req.params.code}\`);
    const builderId = (builderRes.rows[0] as any)?.id;
    if (!builderId) return res.json([]);
    const result = await db.execute(sql\`SELECT * FROM builder_orders WHERE builder_id = \${builderId} ORDER BY created_at DESC LIMIT 20\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/builder-portal/:code/orders", async (req, res) => {
  try {
    const builderRes = await db.execute(sql\`SELECT ba.*, s.id as shop_id FROM builder_accounts ba LEFT JOIN shops s ON ba.shop_id = s.id WHERE ba.access_code = \${req.params.code}\`);
    const builder = builderRes.rows[0] as any;
    if (!builder) return res.status(404).json({ error: "Invalid code" });
    const { projectName, unitNumber, address, stoneType, color, estimatedSqft, edgeProfile, cutouts, requestedDate, priority, notes } = req.body;
    const result = await db.execute(sql\`INSERT INTO builder_orders (builder_id, shop_id, user_id, project_name, unit_number, address, stone_type, color, estimated_sqft, edge_profile, cutouts, requested_date, priority, notes) VALUES (\${builder.id}, \${builder.shop_id||null}, \${builder.user_id}, \${projectName}, \${unitNumber||null}, \${address}, \${stoneType}, \${color||null}, \${estimatedSqft||null}, \${edgeProfile||null}, \${cutouts||null}, \${requestedDate||null}, \${priority||'normal'}, \${notes||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(1023, 0, builderRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
