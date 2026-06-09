const fs = require('fs');
let c = fs.readFileSync('client/src/pages/OtherPages.tsx', 'utf8');

// Remove the misplaced sections from Resources (lines ~40-100)
const wrongPlace = `      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Google Reviews</h2>
        <p className="text-zinc-500 text-sm mb-4">Auto-send a review request when a job is marked complete</p>
        <div className="space-y-3">
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Google Business Review URL</label>
            <input type="text" placeholder="https://g.page/r/YOUR_REVIEW_LINK" value={form?.googleReviewUrl || ""}
              onChange={e => setForm((f: any) => ({ ...f, googleReviewUrl: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            <p className="text-zinc-600 text-xs mt-1">Find this in Google Business Profile - Get more reviews - Share review form</p>
          </div>
          <button onClick={() => mutation.mutate(form)} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-colors">Save Review Link</button>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">SMS Notifications — Coming Soon</h2>
        <p className="text-zinc-500 text-sm mb-4">Text customers automatically when their job reaches key stages</p>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
          <p className="text-zinc-500 text-xs">We are integrating Twilio for automated SMS. Customers will receive texts when their template is scheduled, when their slab is selected, and when installation is complete.</p>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Silica Safety Compliance</h2>
        <p className="text-zinc-500 text-sm mb-4">Track worker training — California SB 20 STOP Act effective July 1 2026</p>
        <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
          <p className="text-blue-400 text-xs font-medium mb-2">All fabrication shops must annually train workers on silica safety and attest to the state.</p>
          <div className="text-zinc-400 text-xs space-y-1">
            <div>Coming next release: Worker training log, annual attestation records, Cal/OSHA inspection documentation, compliance reminders</div>
          </div>
        </div>
      </div>
    </div>
`;

// Find the correct end of Settings component and add there
const correctEnd = `    </div>
  );
}
`;

// Remove from wrong place first
c = c.replace(wrongPlace, '    </div>\n');

// Now add to end of Settings component
const settingsEnd = `          </div>
        )}
      </div>
    </div>
  );
}`;

const settingsEndNew = `          </div>
        )}
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Google Reviews</h2>
        <p className="text-zinc-500 text-sm mb-4">Auto-send a review request when a job is marked complete</p>
        <div className="space-y-3">
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Google Business Review URL</label>
            <input type="text" placeholder="https://g.page/r/YOUR_REVIEW_LINK" value={form?.googleReviewUrl || ""}
              onChange={e => setForm((f: any) => ({ ...f, googleReviewUrl: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            <p className="text-zinc-600 text-xs mt-1">Find in Google Business Profile - Get more reviews - Share review form</p>
          </div>
          <button onClick={() => mutation.mutate(form)} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-colors">Save Review Link</button>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">SMS Notifications — Coming Soon</h2>
        <p className="text-zinc-500 text-sm mb-4">Text customers automatically when their job reaches key stages</p>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
          <p className="text-zinc-500 text-xs">Twilio integration coming soon. Customers will be texted when template is scheduled, slab is selected, and installation is complete.</p>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Silica Safety Compliance</h2>
        <p className="text-zinc-500 text-sm mb-4">Track worker training — California SB 20 STOP Act effective July 1 2026</p>
        <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
          <p className="text-blue-400 text-xs font-medium mb-2">All shops must annually train workers on silica safety and attest to the state.</p>
          <p className="text-zinc-500 text-xs mt-1">Coming next release: Worker training log, attestation records, Cal/OSHA inspection docs, compliance reminders.</p>
        </div>
      </div>
    </div>
  );
}`;

c = c.replace(settingsEnd, settingsEndNew);
fs.writeFileSync('client/src/pages/OtherPages.tsx', c);
console.log('done, length:', c.length);
