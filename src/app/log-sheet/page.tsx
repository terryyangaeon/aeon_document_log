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

function reqBorder(value: string, submitted: boolean) {
  return submitted && !value ? "border-2 border-red-500" : "border border-gray-300";
}

export default function LogSheetPage() {
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [prefixes, setPrefixes] = useState<SystemCode[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addTouched, setAddTouched] = useState(false);
  const [editTouched, setEditTouched] = useState(false);

  const [form, setForm] = useState({
    senderId: "",
    draftedById: "",
    sendTo: "",
    description: "",
    remarks: "",
  });

  const [editForm, setEditForm] = useState({
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
      fetch("/api/accounts/check-role").then((r) => r.json()).catch(() => ({ role: "user" })),
    ]).then(([staff, codes, yrs, roleData]) => {
      setStaffList(staff);
      setPrefixes(codes);
      setYears(yrs);
      setIsAdmin(roleData.role === "admin");
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
    setEditingId(null);
    setAddTouched(false);
    setForm({
      senderId: "",
      draftedById: "",
      sendTo: "",
      description: "",
      remarks: "",
    });
    setPage(1);
  }

  function cancelAdding() {
    setIsAdding(false);
    setAddTouched(false);
  }

  function startEditing(log: DocumentLog) {
    setEditingId(log.id);
    setIsAdding(false);
    setEditTouched(false);
    setEditForm({
      senderId: String(log.senderId),
      draftedById: String(log.draftedById),
      sendTo: log.sendTo,
      description: log.description,
      remarks: log.remarks || "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTouched(false);
  }

  async function handleInlineSave() {
    setAddTouched(true);
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
      setAddTouched(false);
      fetchLogs();
      fetchYears();
    } catch {
      toast.error("Failed to create document log");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSave(id: number) {
    setEditTouched(true);
    if (!editForm.senderId || !editForm.draftedById || !editForm.sendTo || !editForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/document-log", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          senderId: parseInt(editForm.senderId),
          draftedById: parseInt(editForm.draftedById),
          sendTo: editForm.sendTo,
          description: editForm.description,
          remarks: editForm.remarks,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update document log");
        return;
      }
      toast.success("Document updated");
      setEditingId(null);
      setEditTouched(false);
      fetchLogs();
    } catch {
      toast.error("Failed to update document log");
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

  const baseInput = "w-full rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent";
  const colCount = 7 + (isAdmin ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Document Log Sheet</h1>
        <div className="flex items-center gap-3">
          {!isAdding && (
            <button
              onClick={startAdding}
              className="w-8 h-8 flex items-center justify-center bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors"
              title="Get New Ref No."
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
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
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ lineHeight: "1.1" }}>
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-4 py-3 text-left font-medium w-28">Date</th>
                <th className="px-4 py-3 text-left font-medium">Name of Sender</th>
                <th className="px-4 py-3 text-left font-medium">Drafted By</th>
                <th className="px-4 py-3 text-left font-medium">Send To</th>
                <th className="px-4 py-3 text-left font-medium">Document Description</th>
                <th className="px-4 py-3 text-left font-medium">Remarks</th>
                <th className="px-4 py-3 text-left font-medium">Reference No.</th>
                {isAdmin && <th className="px-4 py-3 text-center font-medium w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="border-t-2 border-[#1e3a5f]/30 bg-blue-50/70 align-top">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={todayFormatted}
                      disabled
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={form.senderId}
                      onChange={(e) => setForm({ ...form, senderId: e.target.value })}
                      className={`${baseInput} ${reqBorder(form.senderId, addTouched)}`}
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
                      className={`${baseInput} ${reqBorder(form.draftedById, addTouched)}`}
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
                      className={`${baseInput} ${reqBorder(form.sendTo, addTouched)}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      maxLength={100}
                      rows={2}
                      placeholder="Description"
                      className={`${baseInput} resize-none ${reqBorder(form.description, addTouched)}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      maxLength={100}
                      rows={2}
                      placeholder="Optional"
                      className={`${baseInput} resize-none border border-gray-300`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="border border-dashed border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 font-mono text-[#1e3a5f] font-semibold whitespace-nowrap">
                      {previewRef}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1 justify-center">
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

              {paginatedLogs.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                    No document logs found for {filterYear}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, i) => {
                  const isEditing = editingId === log.id;

                  if (isEditing) {
                    return (
                      <tr key={log.id} className="border-t border-gray-100 bg-yellow-50/70 align-top">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.senderId}
                            onChange={(e) => setEditForm({ ...editForm, senderId: e.target.value })}
                            className={`${baseInput} ${reqBorder(editForm.senderId, editTouched)}`}
                          >
                            {staffList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.draftedById}
                            onChange={(e) => setEditForm({ ...editForm, draftedById: e.target.value })}
                            className={`${baseInput} ${reqBorder(editForm.draftedById, editTouched)}`}
                          >
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
                            value={editForm.sendTo}
                            onChange={(e) => setEditForm({ ...editForm, sendTo: e.target.value })}
                            maxLength={100}
                            className={`${baseInput} ${reqBorder(editForm.sendTo, editTouched)}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            maxLength={100}
                            rows={2}
                            className={`${baseInput} resize-none ${reqBorder(editForm.description, editTouched)}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <textarea
                            value={editForm.remarks}
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                            maxLength={100}
                            rows={2}
                            className={`${baseInput} resize-none border border-gray-300`}
                          />
                        </td>
                        <td className="px-4 py-2 font-mono font-semibold text-[#1e3a5f]">
                          {log.reference}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleEditSave(log.id)}
                              disabled={submitting}
                              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              title="Save"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditing}
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
                    );
                  }

                  return (
                    <tr
                      key={log.id}
                      className={`border-t border-gray-100 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      } hover:bg-blue-50/50 transition-colors`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2">{log.sender.name}</td>
                      <td className="px-4 py-2">{log.draftedBy.name}</td>
                      <td className="px-4 py-2">{log.sendTo}</td>
                      <td className="px-4 py-2">{log.description}</td>
                      <td className="px-4 py-2 text-gray-500">{log.remarks || "-"}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-[#1e3a5f]">
                        {log.reference}
                      </td>
                      {isAdmin && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => startEditing(log)}
                            className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200 bg-gray-50/50">
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
