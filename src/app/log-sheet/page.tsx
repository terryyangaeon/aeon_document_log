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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function LogSheetPage() {
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [prefixes, setPrefixes] = useState<SystemCode[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isAdding, setIsAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState({
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
    setPage(1);
  }, [filterYear]);

  const fetchYears = useCallback(async () => {
    const res = await fetch("/api/document-log/years");
    const data = await res.json();
    setYears(data);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/system-code?type=PREFIX").then((r) => r.json()),
      fetch("/api/document-log/years").then((r) => r.json()),
    ]).then(([staff, codes, yrs]) => {
      setStaffList(staff);
      setPrefixes(codes);
      setYears(yrs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  const prefix = prefixes.length > 0 ? prefixes[0].value : "---";
  const selectedSender = staffList.find((s) => s.id === parseInt(form.senderId));
  const selectedDrafter = staffList.find((s) => s.id === parseInt(form.draftedById));

  const previewRef = (() => {
    const senderPart = selectedSender ? selectedSender.initial.toUpperCase() : "??";
    const drafterPart = selectedDrafter ? selectedDrafter.initial.toLowerCase() : "??";
    const year = new Date().getFullYear();
    return `${prefix}/${senderPart}/???/${year}/${drafterPart}`;
  })();

  function startAdding() {
    setIsAdding(true);
    setForm({
      senderId: "",
      draftedById: "",
      sendTo: "",
      description: "",
      remarks: "",
    });
  }

  function cancelAdding() {
    setIsAdding(false);
  }

  async function handleInlineSave() {
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
          prefix,
          date: new Date().toISOString().split("T")[0],
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
      setIsAdding(false);
      fetchLogs();
      fetchYears();
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

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const inputClass =
    "w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Document Log Sheet</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Year:</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-4 py-3 text-left font-medium w-28">Date</th>
                <th className="px-4 py-3 text-left font-medium">Name of Sender</th>
                <th className="px-4 py-3 text-left font-medium">Drafted By</th>
                <th className="px-4 py-3 text-left font-medium">Send To</th>
                <th className="px-4 py-3 text-left font-medium">Document Description</th>
                <th className="px-4 py-3 text-left font-medium">Remarks</th>
                <th className="px-4 py-3 text-left font-medium">Reference No.</th>
                {isAdding && <th className="px-4 py-3 text-left font-medium w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No document logs found for {filterYear}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, i) => (
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
                    {isAdding && <td></td>}
                  </tr>
                ))
              )}

              {isAdding && (
                <tr className="border-t-2 border-[#1e3a5f]/30 bg-blue-50/70">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={todayFormatted}
                      disabled
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={form.senderId}
                      onChange={(e) => setForm({ ...form, senderId: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">-- Select --</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={form.draftedById}
                      onChange={(e) => setForm({ ...form, draftedById: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">-- Select --</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={form.sendTo}
                      onChange={(e) => setForm({ ...form, sendTo: e.target.value })}
                      maxLength={100}
                      placeholder="Send To"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      maxLength={100}
                      placeholder="Description"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      maxLength={100}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="border border-dashed border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50 font-mono text-[#1e3a5f] font-semibold whitespace-nowrap">
                      {previewRef}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={handleInlineSave}
                        disabled={submitting}
                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        title="Save"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelAdding}
                        className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500"
                        title="Cancel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                onClick={startAdding}
                className="w-8 h-8 flex items-center justify-center bg-[#1e3a5f] text-white rounded hover:bg-[#2d5a8e] transition-colors"
                title="Add new document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-sm text-gray-600">
              {logs.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, logs.length)} of ${logs.length}`}
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &laquo;
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lsaquo;
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
