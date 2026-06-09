import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, CheckCircle, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

export default function QuickBooks() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => fetch("/api/customers", { credentials: "include" }).then(r => r.json()),
  });

  const exportInvoices = () => {
    setExporting(true);
    try {
      const rows: any[] = [];
      (jobs as any[]).forEach((job: any) => {
        const customer = (customers as any[]).find((c: any) => c.id === job.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : job.jobName;
        const invoiceDate = new Date(job.createdAt).toLocaleDateString("en-US");
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US");

        // Main invoice line
        rows.push({
          "InvoiceNo": job.jobNumber || `FAB-${job.id?.slice(0, 8).toUpperCase()}`,
          "Customer": customerName,
          "InvoiceDate": invoiceDate,
          "DueDate": dueDate,
          "Terms": "Net 30",
          "Location": `${job.jobCity || ""} ${job.jobState || ""}`.trim(),
          "Memo": job.jobName,
          "Item(Product/Service)": "Countertop Fabrication & Installation",
          "ItemDescription": `${job.stoneType || "Stone"} - ${job.areas || ""} - ${job.totalSqft || 0} SF`,
          "ItemQuantity": job.totalSqft || 1,
          "ItemRate": job.estimatedRevenue && job.totalSqft ? ((job.estimatedRevenue / job.totalSqft).toFixed(2)) : "0.00",
          "ItemAmount": job.estimatedRevenue || 0,
          "TaxCode": "NON",
          "TaxAmount": "0.00",
          "Currency": "USD",
        });

        // Material cost line if exists
        if (job.materialCost > 0) {
          rows.push({
            "InvoiceNo": job.jobNumber || `FAB-${job.id?.slice(0, 8).toUpperCase()}`,
            "Customer": customerName,
            "InvoiceDate": invoiceDate,
            "DueDate": dueDate,
            "Terms": "Net 30",
            "Location": "",
            "Memo": "",
            "Item(Product/Service)": "Materials",
            "ItemDescription": `Stone material - ${job.stoneType || ""}`,
            "ItemQuantity": 1,
            "ItemRate": job.materialCost,
            "ItemAmount": job.materialCost,
            "TaxCode": "NON",
            "TaxAmount": "0.00",
            "Currency": "USD",
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");
      XLSX.writeFile(wb, `Fabricor-QuickBooks-Export-${new Date().toISOString().split("T")[0]}.xlsx`);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      alert("Export failed. Please try again.");
    }
    setExporting(false);
  };

  const exportCustomers = () => {
    try {
      const rows = (customers as any[]).map((c: any) => ({
        "Customer Name": `${c.firstName} ${c.lastName}`,
        "Company": c.company || "",
        "Email": c.email || "",
        "Phone": c.phone || "",
        "Billing Address Line 1": c.address || "",
        "Billing City": c.city || "",
        "Billing State": c.state || "",
        "Billing Zip": c.zip || "",
        "Customer Type": c.customerType || "retail",
        "Notes": c.notes || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `Fabricor-Customers-QB-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      alert("Export failed.");
    }
  };

  const totalRevenue = (jobs as any[]).reduce((s: number, j: any) => s + (j.estimatedRevenue || 0), 0);
  const unpaidJobs = (jobs as any[]).filter((j: any) => j.stage !== "complete").length;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">QuickBooks Export</h1>
        <p className="text-zinc-500 mt-1">Export jobs and customers directly into QuickBooks — no double entry</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-amber-400 font-mono text-2xl font-bold">{(jobs as any[]).length}</div>
          <div className="text-zinc-500 text-sm mt-1">Total Jobs</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-emerald-400 font-mono text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <div className="text-zinc-500 text-sm mt-1">Total Revenue</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-blue-400 font-mono text-2xl font-bold">{(customers as any[]).length}</div>
          <div className="text-zinc-500 text-sm mt-1">Customers</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Invoice Export</h2>
              <p className="text-zinc-500 text-sm max-w-md">Exports all Fabricor jobs as QuickBooks-formatted invoices. Import directly into QB Online via Sales → Invoices → Import.</p>
              <div className="flex gap-4 mt-3">
                <div className="text-xs text-zinc-600">✓ Invoice numbers</div>
                <div className="text-xs text-zinc-600">✓ Customer names</div>
                <div className="text-xs text-zinc-600">✓ Line items</div>
                <div className="text-xs text-zinc-600">✓ Amounts</div>
              </div>
            </div>
            <button onClick={exportInvoices} disabled={exporting}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl text-sm flex-shrink-0">
              {exporting ? <RefreshCw size={16} className="animate-spin" /> : exported ? <CheckCircle size={16} /> : <Download size={16} />}
              {exporting ? "Exporting..." : exported ? "Downloaded!" : "Export Invoices"}
            </button>
          </div>
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Customer Export</h2>
              <p className="text-zinc-500 text-sm max-w-md">Exports all customers in QuickBooks import format. Import via Sales → Customers → Import.</p>
              <div className="flex gap-4 mt-3">
                <div className="text-xs text-zinc-600">✓ Names & company</div>
                <div className="text-xs text-zinc-600">✓ Contact info</div>
                <div className="text-xs text-zinc-600">✓ Billing address</div>
              </div>
            </div>
            <button onClick={exportCustomers}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-5 py-3 rounded-xl text-sm flex-shrink-0">
              <Download size={16} /> Export Customers
            </button>
          </div>
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-3">How to Import into QuickBooks</h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Download the export file", desc: "Click Export Invoices above to download the Excel file to your computer." },
              { step: "2", title: "Open QuickBooks Online", desc: "Go to Sales → Invoices in the left sidebar." },
              { step: "3", title: "Click Import", desc: "Look for the Import button or gear icon → Import Data → Invoices." },
              { step: "4", title: "Upload the file", desc: "Select the downloaded Excel file and map the columns (they match QB format automatically)." },
              { step: "5", title: "Review and confirm", desc: "QuickBooks will show a preview. Confirm the import and all invoices will be created instantly." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-7 h-7 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-xs font-bold">{step}</span>
                </div>
                <div>
                  <div className="text-zinc-200 text-sm font-medium">{title}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
