const fs = require('fs');
let c = fs.readFileSync('server/index.ts', 'utf8');

const reviewRoute = `
app.post("/api/jobs/:id/send-review-request", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))).limit(1);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const [settings] = await db.select().from(costSettings).where(eq(costSettings.userId, userId)).limit(1);
    const reviewUrl = (settings as any)?.googleReviewUrl;
    if (!reviewUrl) return res.json({ ok: false, message: "No review URL configured" });
    let customerEmail = "";
    if (job.customerId) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
      customerEmail = customer?.email || "";
    }
    if (!customerEmail) return res.json({ ok: false, message: "No customer email" });
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const emailHtml = \`<!DOCTYPE html><html><body style="margin:0;padding:40px;background:#ffffff;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h2 style="color:#1a1a1a;">Thank you for choosing \${user?.shopName || "us"}!</h2><p style="color:#555;line-height:1.6;">Your \${job.stoneType || "stone"} project is now complete. We hope you love your new countertops!</p><p style="color:#555;line-height:1.6;">If you had a great experience, we'd really appreciate a quick Google review. It only takes 30 seconds and helps other homeowners find us.</p><a href="\${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">Leave a Google Review ⭐</a><p style="color:#999;font-size:12px;margin-top:32px;">Thank you from the team at \${user?.shopName || "StoneDesk"}</p></div></body></html>\`;
    await resend.emails.send({
      from: "StoneDesk <reports@sairntech.com>",
      to: customerEmail,
      subject: \`How was your experience with \${user?.shopName || "us"}? Leave a review!\`,
      html: emailHtml,
    });
    res.json({ ok: true, message: \`Review request sent to \${customerEmail}\` });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
`;

c = c.replace('app.listen(PORT,', reviewRoute + '\napp.listen(PORT,');
fs.writeFileSync('server/index.ts', c);
console.log('done');
