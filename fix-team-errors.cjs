const fs = require('fs');

// Fix 1: Duplicate Users in App.tsx - remove from lucide import since it's already imported
let a = fs.readFileSync('client/src/App.tsx', 'utf8');
a = a.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, Users,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles,'
);
fs.writeFileSync('client/src/App.tsx', a);
console.log('App.tsx fixed');

// Fix 2: server/index.ts - use raw SQL for shopId since it's not in Drizzle schema yet
let s = fs.readFileSync('server/index.ts', 'utf8');
s = s.replace(
  `    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.shopId) return res.json([]);
    const result = await db.execute(sql\`SELECT id, name, email, shop_role, created_at FROM users WHERE shop_id = \${user.shopId} ORDER BY created_at ASC\`);`,
  `    const userResult = await db.execute(sql\`SELECT id, name, email, shop_id, shop_role FROM users WHERE id = \${userId}\`);
    const user = userResult.rows[0] as any;
    if (!user?.shop_id) return res.json([]);
    const result = await db.execute(sql\`SELECT id, name, email, shop_role, created_at FROM users WHERE shop_id = \${user.shop_id} ORDER BY created_at ASC\`);`
);
s = s.replace(
  `    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!currentUser?.shopId) return res.status(400).json({ error: "No shop found" });`,
  `    const curResult = await db.execute(sql\`SELECT id, shop_id FROM users WHERE id = \${userId}\`);
    const currentUser = curResult.rows[0] as any;
    if (!currentUser?.shop_id) return res.status(400).json({ error: "No shop found" });`
);
s = s.replace(
  `      shopId: currentUser.shopId, shopRole: role,`,
  `      shopId: currentUser.shop_id, shopRole: role,`
);
// Fix role update route
s = s.replace(
  `    const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
    const { role } = req.body;
    await db.execute(sql\`UPDATE users SET shop_role = \${role} WHERE id = \${req.params.userId} AND shop_id = \${currentUser.shopId}\`);`,
  `    const curRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${currentUserId}\`);
    const cu = curRes.rows[0] as any;
    const { role } = req.body;
    await db.execute(sql\`UPDATE users SET shop_role = \${role} WHERE id = \${req.params.userId} AND shop_id = \${cu.shop_id}\`);`
);
// Fix delete route
s = s.replace(
  `    const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
    await db.execute(sql\`DELETE FROM users WHERE id = \${req.params.userId} AND shop_id = \${currentUser.shopId} AND shop_role != 'owner'\`);`,
  `    const delRes = await db.execute(sql\`SELECT shop_id FROM users WHERE id = \${currentUserId}\`);
    const du = delRes.rows[0] as any;
    await db.execute(sql\`DELETE FROM users WHERE id = \${req.params.userId} AND shop_id = \${du.shop_id} AND shop_role != 'owner'\`);`
);
fs.writeFileSync('server/index.ts', s);
console.log('server fixed');
