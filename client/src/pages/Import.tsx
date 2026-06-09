import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface MappedRow {
  jobNumber: string;
  jobName: string;
  customerName: string;
  address: string;
  city: string;
  state: string;
  salesRep: string;
  sqft: number;
  materialCost: number;
  salePrice: number;
  areas: string;
  status: string;
}

const COLUMN_MAP: Record<string, keyof MappedRow> = {
  "job#": "jobNumber",
  "job": "jobNumber",
  "name": "jobName",
  "job name": "jobName",
  "customer": "customerName",
  "account name": "customerName",
  "job address": "address",
  "address": "address",
  "job city": "city",
  "city": "city",
  "job state": "state",
  "state": "state",
  "sales person": "salesRep",
  "salesperson": "salesRep",
  "ph sqft(sf)": "sqft",
  "sqft": "sqft",
  "activity sqft": "sqft",
  "material cost": "materialCost",
  "sale price": "salePrice",
  "phase area(s)": "areas",
  "areas": "areas",
  "job status": "status",
};

export default function Import() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<MappedRow[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (json.length < 2) return;
      const headers = json[0].map((h: any) => String(h || "").toLowerCase().trim());
      setRawHeaders(json[0].map((h: any) => String(h || "")));
      const mapped: MappedRow[] = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || row.every((v: any) => !v)) continue;
        const obj: any = { jobNumber: "", jobName: "", customerName: "", address: "", city: "", state: "", salesRep: "", sqft: 0, materialCost: 0, salePrice: 0, areas: "", status: "" };
        headers.forEach((h, j) => {
          const key = COLUMN_MAP[h];
          if (key && row[j] !== undefined && row[j] !== null) {
            if (key === "sqft" || key === "materialCost" || key === "salePrice") {
              obj[key] = parseFloat(String(row[j])) || 0;
            } else {
              obj[key] = String(row[j]).trim();
            }
          }
        });
        if (obj.jobName || obj.customerName || obj.jobNumber) {
          mapped.push(obj);
        }
      }
      setRows(mapped);
      setStep("preview");
    };
    reader.readAsBinaryString(file);
  };

  const runImport = async () => {
    setImporting(true);
    setErrors([]);
    let count = 0;
    for (const row of rows) {
      try {
        const nameParts = (row.customerName || "").split(" ");
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.slice(1).join(" ") || "Customer";
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ firstName, lastName, customerType: "retail", company: row.customerName, address: row.address, city: row.city, state: row.state }),
        });
        const customer = await custRes.json();
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jobNumber: row.jobNumber,
            jobName: row.jobName || row.customerName,
            customerId: customer.id,
            jobAddress: row.address,
            jobCity: row.city,
            jobState: row.state,
            areas: row.areas,
            totalSqft: row.sqft,
            materialCost: row.materialCost,
            estimatedRevenue: row.salePrice,
            salesRep: row.salesRep,
            stage: row.status?.toLowerCase().includes("complete") ? "complete" : "inquiry",
          }),
        });
        count++;
      } catch (e) {
        setErrors(errs => [...errs, `Row ${count + 1}: ${(e as Error).message}`]);
      }
    }
    setImported(count);
    setImporting(false);
    setStep("done");
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Excel Import</h1>
        <p className="text-zinc-500 mt-1">Import jobs and customers from any spreadsheet — Moraware, Stone Profit, or your own</p>
      </div>

      {step === "upload" && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-2xl p-16 text-center cursor-pointer transition-colors group">
            <FileSpreadsheet size={48} className="text-zinc-600 group-hover:text-amber-500 mx-auto mb-4 transition-colors" />
            <div className="text-white font-semibold text-lg mb-2">Drop your Excel file here</div>
            <div className="text-zinc-500 text-sm mb-4">Supports .xlsx, .xls, .csv</div>
            <div className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-lg text-sm">
              <Upload size={15} /> Choose File
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

          <div className="mt-8 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3">Supported Columns</h2>
            <p className="text-zinc-500 text-sm mb-4">Fabricor automatically maps these column names from your spreadsheet:</p>
            <div className="grid grid-cols-3 gap-2">
              {["Job#", "Name / Job Name", "Account Name", "Job Address", "Job City", "Job State", "Sales Person", "Ph Sqft(SF)", "Material Cost", "Sale Price", "Phase Area(s)", "Job Status"].map(col => (
                <div key={col} className="bg-zinc-900 rounded-lg px-3 py-2 text-zinc-300 text-xs font-mono">{col}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-white font-semibold">{fileName}</div>
              <div className="text-zinc-500 text-sm">{rows.length} rows ready to import</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep("upload"); setRows([]); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={runImport} disabled={importing || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm">
                {importing ? "Importing..." : <><ChevronRight size={15} /> Import {rows.length} Rows</>}
              </button>
            </div>
          </div>

          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Job#</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Job Name</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">City</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Sq Ft</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Sale Price</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-mono text-xs uppercase">Sales Rep</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
                      <td className="px-4 py-3 text-zinc-400 font-mono">{row.jobNumber}</td>
                      <td className="px-4 py-3 text-zinc-200 max-w-[150px] truncate">{row.jobName}</td>
                      <td className="px-4 py-3 text-zinc-300 max-w-[150px] truncate">{row.customerName}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.city}</td>
                      <td className="px-4 py-3 text-zinc-300 font-mono">{row.sqft.toFixed(1)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">${row.salePrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.salesRep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <div className="px-4 py-3 text-zinc-500 text-xs text-center border-t border-zinc-800">
                  Showing first 50 of {rows.length} rows
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Import Complete!</h2>
          <p className="text-zinc-400 mb-2">{imported} jobs and customers imported successfully</p>
          {errors.length > 0 && (
            <div className="mt-4 bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-left max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                <AlertTriangle size={15} /> {errors.length} errors
              </div>
              {errors.map((e, i) => <div key={i} className="text-zinc-400 text-xs">{e}</div>)}
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => { setStep("upload"); setRows([]); setImported(0); setErrors([]); }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">
              Import Another File
            </button>
            <a href="/jobs" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm">
              View Jobs →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
