"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface Staff {
  id: number;
  name: string;
  initial: string;
  staffNo: string;
  email: string;
}

interface SystemCode {
  id: number;
  type: string;
  value: string;
}

interface DocumentLog {
  id: number;
  date: string;
  prefix: string;
  senderId: number;
  sequence: number;
  draftedById: number;
  reference: string;
  sendTo: string;
  description: string;
  remarks: string | null;
  sender: Staff;
  draftedBy: Staff;
}

export default function LogSheetPage() {
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [prefixes, setPrefixes] = useState<SystemCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    prefix: "",
    senderId: "",
    draftedById: "",
    sendTo: "",
    description: "",
    remarks: "",
  });

  const fetchLogs = useCallback(async () => {
    const res = await fetch(`/api/document-log?year=${filterYear}`);
    const data = await res.json();
    setLogs(data.logs);
  }, [filterYear]);

  useEffect(() => {
    Promise.all([
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/system-code?type=PREFIX").then((r) => r.json()),
    ]).then(([staff, codes]) => {
      setStaffList(staff);
      setPrefixes(codes);
      if (codes.length > 0) setForm((f) => ({ ...f, prefix: codes[0].value }));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const selectedSender = staffList.find((s) => s.id === parseInt(form.senderId));
  const selectedDrafter = staffList.find((s) => s.id === parseInt(form.draftedById));

  const previewRef = (() => {
    if (!form.prefix || !selectedSender || !selectedDrafter || !form.date) return "---";
    const year = new Date(form.date).getFullYear();
    const senderInitial = selectedSender.initial.toUpperCase();
    const drafterInitial = selectedDrafter.initial.toLowerCase();
    return `${form.prefix}/${senderInitial}/???/${year}/${drafterInitial}`;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.senderId || !form.draftedById || !form.sendTo || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/document-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          senderId: parseInt(form.senderId),
          draftedById: parseInt(form.draftedById),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create document log");
        return;
      }
      const doc = await res.json();
      toast.success(`Document created: ${doc.reference}`);
      setShowForm(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        prefix: prefixes[0]?.value || "",
        senderId: "",
        draftedById: "",
        sendTo: "",
        description: "",
        remarks: "",
      });
      fetchLogs();
    } catch {
      toast.error("Failed to create document log");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Document Log Sheet</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Year:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
          >
            {showForm ? "Cancel" : "+ New Document"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">
            New Document Log Entry
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefix <span className="text-red-500">*</span>
              </label>
              <select
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              >
                {prefixes.map((p) => (
                  <option key={p.id} value={p.value}>
                    {p.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender (Name of Sender) <span className="text-red-500">*</span>
              </label>
              <select
                value={form.senderId}
                onChange={(e) => setForm({ ...form, senderId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              >
                <option value="">-- Select Sender --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.initial})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drafted By <span className="text-red-500">*</span>
              </label>
              <select
                value={form.draftedById}
                onChange={(e) =>
                  setForm({ ...form, draftedById: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              >
                <option value="">-- Select Drafter --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.initial})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send To <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.sendTo}
                onChange={(e) => setForm({ ...form, sendTo: e.target.value })}
                maxLength={100}
                placeholder="e.g. Transport Department"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={100}
                placeholder="e.g. Notice"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                maxLength={100}
                placeholder="Optional remarks"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference No. (Preview)
                </label>
                <div className="w-full border border-dashed border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 font-mono text-[#1e3a5f] font-semibold">
                  {previewRef}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Name of Sender</th>
                <th className="px-4 py-3 text-left font-medium">Drafted By</th>
                <th className="px-4 py-3 text-left font-medium">Send To</th>
                <th className="px-4 py-3 text-left font-medium">Document Description</th>
                <th className="px-4 py-3 text-left font-medium">Remarks</th>
                <th className="px-4 py-3 text-left font-medium">Reference No.</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No document logs found for {filterYear}
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{log.sender.name}</td>
                    <td className="px-4 py-3">{log.draftedBy.name}</td>
                    <td className="px-4 py-3">{log.sendTo}</td>
                    <td className="px-4 py-3">{log.description}</td>
                    <td className="px-4 py-3 text-gray-500">{log.remarks || "-"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#1e3a5f]">
                      {log.reference}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
