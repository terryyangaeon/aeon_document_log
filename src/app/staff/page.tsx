"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";

interface Staff {
  id: number;
  name: string;
  initial: string;
  staffNo: string;
  email: string;
  isActive: boolean;
}

const emptyForm = { name: "", initial: "", staffNo: "", email: "" };
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchStaff(status?: string) {
    const s = status ?? statusFilter;
    const res = await fetch(`/api/staff?status=${s}`);
    setStaffList(await res.json());
    setPage(1);
    setLoading(false);
  }

  useEffect(() => {
    fetchStaff();
    fetch("/api/accounts/check-role")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  function startEdit(staff: Staff) {
    setForm({
      name: staff.name,
      initial: staff.initial,
      staffNo: staff.staffNo,
      email: staff.email,
    });
    setEditingId(staff.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.initial || !form.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId, isActive: true } : form;

    const res = await fetch("/api/staff", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Failed to save staff record");
      return;
    }

    toast.success(editingId ? "Staff updated" : "Staff created");
    cancelForm();
    fetchStaff();
  }

  async function handleDeactivate(id: number) {
    if (!confirm("Are you sure you want to deactivate this staff?")) return;
    await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
    toast.success("Staff deactivated");
    fetchStaff();
  }

  function downloadTemplate() {
    const header = "Name,Initial,Staff No,Email";
    const example = "John Doe,JD,S001,john.doe@example.com";
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("File must have a header row and at least one data row");
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          name: cols[0] || "",
          initial: cols[1] || "",
          staffNo: cols[2] || "",
          email: cols[3] || "",
        };
      });

      const res = await fetch("/api/staff/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msgs = data.errors?.join("\n") || data.error;
        toast.error(msgs, { duration: 6000 });
        return;
      }

      if (data.errors?.length > 0) {
        toast.success(`Imported ${data.imported} records`);
        toast.error(`${data.errors.length} rows skipped:\n${data.errors.join("\n")}`, { duration: 6000 });
      } else {
        toast.success(`Successfully imported ${data.imported} records`);
      }

      fetchStaff();
    } catch {
      toast.error("Failed to import file");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const filteredStaff = searchQuery
    ? staffList.filter((s) => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.staffNo.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      })
    : staffList;

  const duplicateInitials = useMemo(() => {
    const activeStaff = statusFilter === "inactive" ? [] : staffList.filter((s) => s.isActive);
    const counts = new Map<string, number>();
    for (const s of activeStaff) {
      const key = s.initial.toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [key, count] of counts) {
      if (count > 1) dupes.add(key);
    }
    return dupes;
  }, [staffList, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const paginatedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

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
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Staff Records</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Name, Staff No, or Email"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchStaff(e.target.value);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
          {isAdmin && (
            <>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f]/5 transition-colors text-sm font-medium"
            >
              Download Template
            </button>
            <label
              className={`px-4 py-2 border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f]/5 transition-colors text-sm font-medium cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}
            >
              {importing ? "Importing..." : "Import"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => (showForm ? cancelForm() : setShowForm(true))}
              className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
            >
              {showForm ? "Cancel" : "+ Add Staff"}
            </button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">
            {editingId ? "Edit Staff" : "New Staff"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.initial}
                onChange={(e) => setForm({ ...form, initial: e.target.value })}
                maxLength={10}
                placeholder="e.g. MB"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff No
              </label>
              <input
                type="text"
                value={form.staffNo}
                onChange={(e) => setForm({ ...form, staffNo: e.target.value })}
                maxLength={10}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={50}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
            >
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ lineHeight: "1.1" }}>
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Initial</th>
                <th className="px-4 py-3 text-left font-medium">Staff No</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                {isAdmin && <th className="px-4 py-3 text-center font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-400">
                    No staff records found
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className="px-4 py-2">{s.name}</td>
                    <td className={`px-4 py-2 font-mono ${duplicateInitials.has(s.initial.toUpperCase()) ? "bg-red-100 text-red-700 font-semibold" : ""}`}>{s.initial}</td>
                    <td className="px-4 py-2">{s.staffNo}</td>
                    <td className="px-4 py-2">{s.email}</td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(s.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      </td>
                    )}
                  </tr>
                ))
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
              {filteredStaff.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredStaff.length)} of ${filteredStaff.length}`}
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
