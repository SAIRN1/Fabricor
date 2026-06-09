const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');
const anniversaryCode = `
async function sendAnniversaryReminders() {
  try {
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const start = new Date(oneYearAgo);
      start.setDate(start.getDate() - 7);
      const end = new Date(oneYearAgo);
      end.setDate(end.getDate() + 7);
      const result = await db.execute(sql\`
        SELECT j.*, c.email as customer_email, c.first_name, c.last_name
        FROM jobs j
        JOIN customers c ON j.customer_id = c.id
        WHERE j.user_id = \${user.id}
          AND j.stage = 'complete'
          AND j.updated_at BETWEEN \${start.toISOString()} AND \${end.toISOString()}
          AND c.email IS NOT NULL
          AND c.email != ''
      \`);
      for (const job of result.rows as any[]) {
        const emailHtml = \`<!DOCTYPE html><html><body style="margin:0;padding:40px;background:#ffffff;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h2 style="color:#1a1a1a;">Happy Anniversary, \${job.first_name}!</h2><p style="color:#555;line-height:1.6;">It's been one year since we installed your \${job.stone_type || 'stone'} countertops — we hope you're still loving them!</p><p style="color:#555;line-height:1.6;">If you have any questions about care and maintenance, or if you're thinking about another project, we'd love to hear from you.</p><p style="color:#555;line-height:1.6;">And if you've been happy with our work, a quick Google review means the world to us and helps other homeowners find us.</p><p style="color:#999;font-size:12px;margin-top:32px;">Warm regards,<br/>\${user.shopName || 'StoneDesk'}</p></div></body></html>\`;
        await resend.emails.send({
          from: "StoneDesk <reports@sairntech.com>",
          to: job.customer_email,
          subject: \`Happy 1-Year Anniversary with your new countertops!\`,
          html: emailHtml,
        });
        console.log(\`[Anniversary] Sent to \${job.customer_email} for job \${job.job_name}\`);
      }
    }
  } catch (e) { console.error("[Anniversary] Error:", e); }
}
cron.schedule("0 9 * * 1", sendAnniversaryReminders, { timezone: "America/New_York" });
console.log("Anniversary cron scheduled — every Monday 9am ET");
`;
const lines = c.split('\n');
lines.splice(834, 0, anniversaryCode);
fs.writeFileSync('server/index.ts', lines.join('\n'));
console.log('done');
