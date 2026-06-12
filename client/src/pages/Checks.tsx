// ============================================================
// StoneDesk — Check Register & Printing
// SAIRN Technologies · Michael L. Dibert
// Client supplies 3-per-page blank check stock from any bank
// ============================================================

import { useState, useEffect } from "react";

interface CheckRecord {
  num: number;
  date: string;
  payTo: string;
  amount: number;
  memo: string;
  category: string;
  payeeAddr: string;
  words: string;
  printed: boolean;
  voided?: boolean;
  savedAt: string;
}

interface BankSetup {
  company: string;
  addr1: string;
  addr2: string;
  phone: string;
  bankName: string;
  routing: string;
  account: string;
  startingNum: number;
  nickname: string;
}

interface CheckData {
  bank: BankSetup;
  register: CheckRecord[];
}

const EMPTY_BANK: BankSetup = {
  company: '', addr1: '', addr2: '', phone: '',
  bankName: '', routing: '', account: '', startingNum: 1001, nickname: ''
};

function dollarsToWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'ZERO AND 00/100';
  const ones = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE',
    'TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN'];
  const tens = ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'];
  function numToWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? '-' + ones[n%10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n/100)] + ' HUNDRED ' + numToWords(n%100);
    if (n < 1000000) return numToWords(Math.floor(n/1000)) + 'THOUSAND ' + numToWords(n%1000);
    return numToWords(Math.floor(n/1000000)) + 'MILLION ' + numToWords(n%1000000);
  }
  const parts = amount.toFixed(2).split('.');
  const dollars = parseInt(parts[0]);
  const cents = parts[1];
  const words = dollars === 0 ? 'ZERO' : numToWords(dollars).trim();
  return words + ' AND ' + cents + '/100';
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${m}/${day}/${y}`;
}

function loadData(): CheckData {
  try {
    const raw = localStorage.getItem('sairn_checks');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bank: EMPTY_BANK, register: [] };
}
function saveData(data: CheckData) {
  localStorage.setItem('sairn_checks', JSON.stringify(data));
}

export default function Checks() {
  const [tab, setTab] = useState<'write'|'register'|'setup'>('write');
  const [data, setData] = useState<CheckData>(loadData());
  const [bank, setBank] = useState<BankSetup>(data.bank || EMPTY_BANK);
  const [payTo, setPayTo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState('Labor');
  const [payeeAddr, setPayeeAddr] = useState('');
  const [notify, setNotify] = useState<{msg:string;color:string}|null>(null);

  const nextNum = (data.bank?.startingNum || 1001) + (data.register?.length || 0);
  const totalPaid = (data.register || []).filter(c => !c.voided).reduce((s,c) => s + c.amount, 0);
  const amountNum = parseFloat(amount) || 0;
  const words = amountNum > 0 ? dollarsToWords(amountNum) : '—';

  function showNotify(msg: string, color: string) {
    setNotify({ msg, color });
    setTimeout(() => setNotify(null), 3200);
  }

  function saveBank() {
    const updated = { ...data, bank };
    saveData(updated);
    setData(updated);
    showNotify('Bank account saved', 'green');
  }

  function saveCheck(printed: boolean) {
    if (!payTo.trim() || !amountNum) { showNotify('Pay To and Amount are required','red'); return; }
    const record: CheckRecord = {
      num: nextNum, date, payTo, amount: amountNum, memo, category,
      payeeAddr, words: dollarsToWords(amountNum), printed,
      savedAt: new Date().toISOString()
    };
    const updated = { ...data, register: [record, ...(data.register||[])] };
    saveData(updated);
    setData(updated);
    setPayTo(''); setAmount(''); setMemo(''); setPayeeAddr('');
    if (printed) printCheck(record, data.bank);
    showNotify(`Check #${nextNum} ${printed ? 'printed &' : ''} saved to register`, 'green');
  }

  function printCheck(check: CheckRecord, b: BankSetup) {
    const micrLine = `C${String(check.num).padStart(6,'0')}C  A${b.routing||'?????????'}A  ${b.account||'??????????'}C`;
    const w = window.open('', '_blank');
    if (!w) return;
    const css = `
      * { box-sizing:border-box;margin:0;padding:0; }
      body { font-family:Arial,sans-serif;background:#fff; }
      @page { margin:0;size:8.5in 11in; }
      @media print { .no-print { display:none!important; } }
      .page { width:8.5in;height:11in;padding:.25in;display:flex;flex-direction:column; }
      .stub { width:100%;height:1in;border:1px solid #e5e7eb;border-radius:4px;padding:.1in .2in;display:flex;gap:20px;align-items:center;background:#f9fafb;margin-bottom:.04in; }
      .stub-f { font-size:10px;color:#374151;line-height:1.6; }
      .check { width:100%;height:3.4in;border:1px solid #ccc;border-radius:4px;padding:.18in .22in;display:flex;flex-direction:column;justify-content:space-between;background:#fff;margin-bottom:.04in; }
      .ch { display:flex;justify-content:space-between;align-items:flex-start; }
      .co { font-size:13px;font-weight:700;line-height:1.4; }
      .cs { font-size:10px;color:#555; }
      .cn { font-family:monospace;font-size:13px;font-weight:700;text-align:right; }
      .dr { display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:5px 0; }
      .dl { font-size:10px;color:#555; }
      .dv { font-size:12px;font-weight:600;border-bottom:1px solid #999;min-width:120px;text-align:center;padding:1px 4px; }
      .pr { display:flex;align-items:flex-end;gap:10px;margin:3px 0; }
      .pl { font-size:10px;color:#555;white-space:nowrap;font-weight:600; }
      .pv { font-size:14px;font-weight:700;border-bottom:1.5px solid #111;flex:1;padding:2px 4px; }
      .ab { font-family:monospace;font-size:14px;font-weight:800;border:2px solid #111;padding:4px 10px;border-radius:3px;min-width:120px;text-align:center;background:#f9f9f9; }
      .wr { display:flex;align-items:flex-end;gap:8px;margin:3px 0; }
      .wv { font-size:11px;font-weight:600;border-bottom:1px solid #999;flex:1;padding:2px 4px;letter-spacing:.5px;text-transform:uppercase; }
      .mr { display:flex;justify-content:space-between;align-items:flex-end;margin:5px 0 2px; }
      .ml { font-size:9px;color:#555;margin-bottom:2px; }
      .mv { font-size:11px;border-bottom:1px solid #999;min-width:200px;padding:2px 4px; }
      .sl { border-top:1px solid #111;width:200px;text-align:center;font-size:9px;color:#555;padding-top:2px;margin-left:auto; }
      .micr { font-family:monospace;font-size:11px;color:#111;letter-spacing:3px; }
      .mr2 { display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed #ddd;padding-top:4px;margin-top:4px; }
      .np { position:fixed;bottom:20px;right:20px;background:#059669;color:#fff;border:none;padding:14px 28px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer; }
    `;
    w.document.write(`<!DOCTYPE html><html><head><title>Check #${check.num}</title><style>${css}</style></head><body>`);
    w.document.write(`<button class="np no-print" onclick="window.print()">🖨 Print Check</button><div class="page">`);
    w.document.write(`<div class="stub"><div class="stub-f"><strong>Check #:</strong> ${check.num}</div><div class="stub-f"><strong>Date:</strong> ${fmtDate(check.date)}</div><div class="stub-f"><strong>Pay To:</strong> ${check.payTo}</div><div class="stub-f"><strong>Amount:</strong> ${fmtMoney(check.amount)}</div><div class="stub-f"><strong>Memo:</strong> ${check.memo||'—'}</div><div class="stub-f"><strong>Category:</strong> ${check.category}</div><div class="stub-f" style="margin-left:auto"><strong>Balance:</strong> _______________</div></div>`);
    const chk = (label: string, val: string) => `<div class="stub-f"><strong>${label}:</strong> ${val}</div>`;
    w.document.write(`<div class="check"><div class="ch"><div><div class="co">${b.company||'Your Company'}</div><div class="cs">${b.addr1||''}</div><div class="cs">${b.addr2||''}</div><div class="cs">${b.phone||''}</div></div><div class="cn"><div style="font-size:10px;color:#555;margin-bottom:2px">CHECK NO.</div>${check.num}</div></div><div class="dr"><span class="dl">DATE</span><span class="dv">${fmtDate(check.date)}</span></div><div class="pr"><span class="pl">PAY TO THE ORDER OF</span><span class="pv">${check.payTo}</span><span class="ab">$ ${check.amount.toFixed(2)}</span></div><div class="wr"><span class="wv">${check.words}</span><span style="font-size:9px;color:#555;white-space:nowrap">DOLLARS</span></div><div class="mr"><div><div class="ml">MEMO</div><div class="mv">${check.memo||''}</div></div><div style="text-align:right"><div style="font-size:10px;font-weight:700;color:#333">${b.bankName||'Your Bank'}</div></div></div><div style="display:flex;justify-content:flex-end"><div class="sl">Authorized Signature</div></div><div class="mr2"><div class="micr">${micrLine}</div><div style="font-size:9px;color:#aaa">VOID AFTER 90 DAYS</div></div></div>`);
    // 2 blank checks
    for (let i = 0; i < 2; i++) {
      w.document.write(`<div class="stub" style="background:#fff;border:1px dashed #e5e7eb"><div style="font-size:10px;color:#ddd;width:100%;text-align:center">— stub —</div></div><div class="check" style="opacity:.1"><div class="ch"><div><div class="co">${b.company||''}</div></div></div><div class="dr"><span class="dl">DATE</span><span class="dv"></span></div><div class="pr"><span class="pl">PAY TO THE ORDER OF</span><span class="pv"></span><span class="ab">$</span></div><div class="wr"><span class="wv"></span></div><div class="mr"><div><div class="ml">MEMO</div><div class="mv"></div></div></div><div style="display:flex;justify-content:flex-end"><div class="sl">Authorized Signature</div></div><div class="mr2"><div class="micr">${micrLine}</div></div></div>`);
    }
    w.document.write(`</div></body></html>`);
    w.document.close();
  }

  function exportCSV() {
    const rows = ['Check #,Date,Pay To,Memo,Category,Amount,Status'];
    (data.register||[]).forEach(c => {
      rows.push([c.num, c.date, `"${c.payTo}"`, `"${c.memo||''}"`, c.category, c.amount.toFixed(2), c.voided?'VOID':c.printed?'PRINTED':'SAVED'].join(','));
    });
    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'check_register_stonedesk.csv'; a.click();
  }

  function voidCheck(i: number) {
    if (!confirm('Mark this check as VOID?')) return;
    const updated = { ...data };
    updated.register[i] = { ...updated.register[i], voided: true, printed: false };
    saveData(updated); setData(updated);
    showNotify('Check voided','amber');
  }

  const CATEGORIES = ['Labor / Payroll','Materials','Subcontractor','Equipment / Rental','Supplies','Utilities','Insurance','Taxes / Fees','Vendor / Supplier','Other'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 980, fontFamily: 'inherit' }}>
      {/* Notify */}
      {notify && (
        <div style={{ position:'fixed', bottom:20, right:20, background: notify.color==='green'?'#059669':notify.color==='red'?'#dc2626':'#d97706', color:'#fff', padding:'10px 20px', borderRadius:10, fontWeight:700, fontSize:13, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,.25)' }}>
          {notify.msg}
        </div>
      )}

      <div style={{ fontSize:22, fontWeight:800, color:'#111827', marginBottom:4 }}>✍️ Check Register & Printing</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:22 }}>Write, print, and track checks — on your own blank check stock from any bank or office supply store</div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { val: (data.register||[]).length, label:'Total Checks', color:'#374151' },
          { val: fmtMoney(totalPaid), label:'Total Paid', color:'#059669' },
          { val: '#' + nextNum, label:'Next Check #', color:'#374151' },
          { val: bank.nickname || bank.bankName || 'Not set', label:'Bank Account', color:'#374151' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ fontSize:i===3?13:22, fontWeight:800, color:k.color, fontFamily:'JetBrains Mono, monospace' }}>{k.val}</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#9ca3af', marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #e5e7eb', marginBottom:22 }}>
        {(['write','register','setup'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background:'none', border:'none', padding:'10px 20px', fontSize:13, fontWeight:600, color: tab===t ? '#059669':'#6b7280', borderBottom: tab===t ? '3px solid #059669':'3px solid transparent', marginBottom:-2, cursor:'pointer', fontFamily:'inherit' }}>
            {t==='write'?'✍️ Write a Check':t==='register'?'📋 Register':'⚙️ Bank Setup'}
          </button>
        ))}
      </div>

      {/* WRITE TAB */}
      {tab === 'write' && (
        <div>
          <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#92400e', marginBottom:16, lineHeight:1.7 }}>
            ℹ️ <strong>How to print:</strong> Load standard 3-per-page blank check stock (available at your bank, Staples, Amazon, ~$30/300 checks). Fill the form below → click Print Check → sign and mail. Set up your bank account in the <strong>Bank Setup</strong> tab first.
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'22px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Check Number</label>
                <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8, padding:'9px 14px', fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:'#059669' }}>#{nextNum}</div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:13, fontFamily:'inherit', outline:'none' }} />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Pay To The Order Of *</label>
              <input value={payTo} onChange={e => setPayTo(e.target.value)} placeholder="Payee name or company" style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:15, fontWeight:600, fontFamily:'inherit', outline:'none' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Amount ($) *</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:20, fontWeight:800, fontFamily:'JetBrains Mono, monospace', outline:'none' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Written Amount (auto)</label>
                <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8, padding:'9px 14px', fontSize:11, fontWeight:700, color:'#059669', letterSpacing:.5, textTransform:'uppercase', minHeight:40 }}>{words}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Memo / Invoice Reference</label>
                <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Invoice #, job description, reason" style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:13, fontFamily:'inherit', outline:'none' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>Payee Address (optional — for window envelope)</label>
              <input value={payeeAddr} onChange={e => setPayeeAddr(e.target.value)} placeholder="Payee mailing address" style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:13, fontFamily:'inherit', outline:'none' }} />
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
              <button onClick={() => saveCheck(true)} style={{ padding:'10px 22px', background:'#059669', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>🖨 Print Check</button>
              <button onClick={() => saveCheck(false)} style={{ padding:'10px 18px', background:'#f0fdf4', color:'#059669', border:'1.5px solid #bbf7d0', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>💾 Save to Register Only</button>
            </div>
            {amountNum > 0 && (
              <div style={{ padding:'12px 16px', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>Check Total:</span>
                <span style={{ fontSize:24, fontWeight:800, color:'#059669', fontFamily:'JetBrains Mono, monospace' }}>{fmtMoney(amountNum)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTER TAB */}
      {tab === 'register' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>All Checks Written</div>
            <button onClick={exportCSV} style={{ padding:'6px 14px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', color:'#6b7280' }}>⬇ Export CSV</button>
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['Check #','Date','Pay To','Memo','Category','Amount','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', color:'#9ca3af' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!(data.register||[]).length && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:24, color:'#9ca3af' }}>No checks written yet.</td></tr>
                )}
                {(data.register||[]).map((c,i) => (
                  <tr key={i} style={{ borderTop:'1px solid #e5e7eb' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:12 }}>#{c.num}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{fmtDate(c.date)}</td>
                    <td style={{ padding:'9px 12px', fontSize:13, fontWeight:600, color:'#111' }}>{c.payTo}</td>
                    <td style={{ padding:'9px 12px', fontSize:12, color:'#6b7280' }}>{c.memo||'—'}</td>
                    <td style={{ padding:'9px 12px' }}><span style={{ background:'#f0fdf4', color:'#059669', padding:'2px 8px', borderRadius:12, fontWeight:600, fontSize:10 }}>{c.category}</span></td>
                    <td style={{ padding:'9px 12px', fontWeight:800, color:'#059669', fontFamily:'JetBrains Mono, monospace' }}>{fmtMoney(c.amount)}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ background:c.voided?'#fef2f2':c.printed?'#f0fdf4':'#fefce8', color:c.voided?'#dc2626':c.printed?'#059669':'#92400e', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700 }}>
                        {c.voided?'VOID':c.printed?'PRINTED':'SAVED'}
                      </span>
                      {!c.voided && <button onClick={() => voidCheck(i)} style={{ marginLeft:6, background:'none', border:'1px solid #fca5a5', color:'#dc2626', fontSize:10, padding:'2px 7px', borderRadius:6, cursor:'pointer' }}>Void</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETUP TAB */}
      {tab === 'setup' && (
        <div>
          <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#92400e', marginBottom:16, lineHeight:1.7 }}>
            🔒 <strong>Security:</strong> Your banking information is stored only on this device and never transmitted to any external server. Only administrators should access this screen.
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'22px 24px' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:16 }}>Bank Account Information</div>
            {([
              [['Company Name (as on checks)','company'],['Address Line 1','addr1']],
              [['City, State ZIP','addr2'],['Phone','phone']],
              [['Bank Name','bankName'],['Routing Number (9 digits)','routing'],['Account Number','account']],
              [['Starting Check Number','startingNum'],['Account Nickname (internal)','nickname']],
            ] as [string,keyof BankSetup][][]).map((row,ri) => (
              <div key={ri} style={{ display:'grid', gridTemplateColumns:`repeat(${row.length},1fr)`, gap:12, marginBottom:12 }}>
                {row.map(([label,field]) => (
                  <div key={field}>
                    <label style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#6b7280', display:'block', marginBottom:5 }}>{label}</label>
                    <input
                      type={field==='startingNum'?'number':'text'}
                      value={String(bank[field]||'')}
                      onChange={e => setBank(b => ({ ...b, [field]: field==='startingNum'?parseInt(e.target.value)||1001:e.target.value }))}
                      style={{ width:'100%', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 14px', fontSize:13, fontFamily:'inherit', outline:'none' }}
                    />
                  </div>
                ))}
              </div>
            ))}
            <button onClick={saveBank} style={{ padding:'10px 22px', background:'#059669', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginTop:6 }}>💾 Save Bank Setup</button>
          </div>
        </div>
      )}
    </div>
  );
}
