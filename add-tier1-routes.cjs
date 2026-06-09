const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const routes = `
app.get("/api/remnants", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT *, (length_inches * width_inches / 144) as sqft FROM remnants WHERE user_id = \${userId} ORDER BY created_at DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/remnants", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { material, stoneType, color, lengthInches, widthInches, location, status, notes } = req.body;
    const sqft = (parseFloat(lengthInches)||0) * (parseFloat(widthInches)||0) / 144;
    const result = await db.execute(sql\`INSERT INTO remnants (user_id, material, stone_type, color, length_inches, width_inches, sqft, location, status, notes) VALUES (\${userId}, \${material||null}, \${stoneType}, \${color||null}, \${lengthInches||null}, \${widthInches||null}, \${sqft}, \${location||null}, \${status||'available'}, \${notes||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/remnants/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { status } = req.body;
    const result = await db.execute(sql\`UPDATE remnants SET status = \${status} WHERE id = \${req.params.id} AND user_id = \${userId} RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/remnants/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`DELETE FROM remnants WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/care-guides", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM care_guides WHERE user_id = \${userId} ORDER BY created_at DESC LIMIT 20\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/care-guides", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { stoneType, guideText, sentTo, jobId } = req.body;
    const result = await db.execute(sql\`INSERT INTO care_guides (user_id, job_id, stone_type, guide_text, sent_to) VALUES (\${userId}, \${jobId||null}, \${stoneType}, \${guideText}, \${sentTo||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/tax-credits", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql\`SELECT * FROM tax_credits WHERE user_id = \${userId} ORDER BY purchase_date DESC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/tax-credits", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { description, amount, category, purchaseDate, taxYear, notes } = req.body;
    const result = await db.execute(sql\`INSERT INTO tax_credits (user_id, description, amount, category, purchase_date, tax_year, notes) VALUES (\${userId}, \${description}, \${parseFloat(amount)||0}, \${category}, \${purchaseDate}, \${parseInt(taxYear)||new Date().getFullYear()}, \${notes||null}) RETURNING *\`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/tax-credits/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql\`DELETE FROM tax_credits WHERE id = \${req.params.id} AND user_id = \${userId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;
const lines = c.split('\n');
lines.splice(953, 0, routes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
