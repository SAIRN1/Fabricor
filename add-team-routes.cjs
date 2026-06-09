const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const teamRoutes = `
app.get("/api/team", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.shopId) return res.json([]);
    const result = await db.execute(sql\`SELECT id, name, email, shop_role, created_at FROM users WHERE shop_id = \${user.shopId} ORDER BY created_at ASC\`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/team/invite", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!currentUser?.shopId) return res.status(400).json({ error: "No shop found" });
    const { name, email, password, role } = req.body;
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing[0]) return res.status(400).json({ error: "Email already in use" });
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.default.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      name, email: email.toLowerCase(), password: hashed,
      role: "viewer", plan: "starter",
      shopId: currentUser.shopId, shopRole: role,
    } as any).returning();
    res.json({ ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/team/:userId/role", requireAuth, async (req, res) => {
  try {
    const currentUserId = (req.session as any).userId;
    const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
    const { role } = req.body;
    await db.execute(sql\`UPDATE users SET shop_role = \${role} WHERE id = \${req.params.userId} AND shop_id = \${currentUser.shopId}\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to update role" }); }
});
app.delete("/api/team/:userId", requireAuth, async (req, res) => {
  try {
    const currentUserId = (req.session as any).userId;
    const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
    await db.execute(sql\`DELETE FROM users WHERE id = \${req.params.userId} AND shop_id = \${currentUser.shopId} AND shop_role != 'owner'\`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to remove member" }); }
});
`;
const lines = c.split('\n');
lines.splice(871, 0, teamRoutes);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
