const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const portalRoute = `
app.get("/api/portal/job", async (req, res) => {
  try {
    const { jobNumber, email } = req.query as { jobNumber: string; email: string };
    if (!jobNumber || !email) return res.status(400).json({ error: "Job number and email required" });
    const customer = await db.select().from(customers).where(eq(customers.email, email.toLowerCase())).limit(1);
    if (!customer[0]) return res.json({ job: null });
    const job = await db.select().from(jobs).where(and(eq(jobs.customerId, customer[0].id), eq(jobs.jobNumber, jobNumber))).limit(1);
    if (!job[0]) return res.json({ job: null });
    res.json({ job: { id: job[0].id, jobName: job[0].jobName, jobNumber: job[0].jobNumber, stage: job[0].stage, stoneType: job[0].stoneType, areas: job[0].areas, jobCity: job[0].jobCity, jobState: job[0].jobState } });
  } catch (e) { res.status(500).json({ error: "Failed to fetch job" }); }
});
`;
c = c.replace('app.listen(PORT,', portalRoute + '\napp.listen(PORT,');
fs.writeFileSync('server/index.ts', c);
console.log('done');
