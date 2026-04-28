import * as XLSX from "xlsx";
import { SURVEY_QUESTIONS, getOptionLabel, LEAD_STATUSES } from "./survey";

const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.label || s;

function buildRows(leads: any[], responses: any[]) {
  const respByLead = new Map<string, any>();
  for (const r of responses) respByLead.set(r.lead_id, r.answers || {});
  return leads.map((l) => {
    const a = respByLead.get(l.id) || {};
    const row: Record<string, any> = {
      Business: l.business_name,
      "Business Type": l.business_type || "",
      Contact: l.contact_name || "",
      Email: l.email || "",
      Phone: l.phone || "",
      Address: l.address || "",
      City: l.city || "",
      Status: statusLabel(l.status),
      "Trial Lead": l.is_trial_lead ? "Yes" : "No",
      Notes: l.notes || "",
      Created: new Date(l.created_at).toISOString().slice(0, 10),
    };
    for (const q of SURVEY_QUESTIONS) {
      const v = a[q.id];
      row[q.label] = v == null || v === "" ? "" : q.type === "single" ? getOptionLabel(q.id, v) : v;
    }
    return row;
  });
}

export function exportLeadsCSV(leads: any[], responses: any[]) {
  const rows = buildRows(leads, responses);
  if (rows.length === 0) throw new Error("No data to export");
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(csv, `market-research-${todayStamp()}.csv`, "text/csv");
}

export function exportLeadsXLSX(leads: any[], responses: any[]) {
  const rows = buildRows(leads, responses);
  if (rows.length === 0) throw new Error("No data to export");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, `market-research-${todayStamp()}.xlsx`);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
function download(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
