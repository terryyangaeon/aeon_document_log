"use client";

import { useEffect, useState } from "react";
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

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchStaff() {
    const res = await fetch("/api/staff");
    setStaffList(await res.json());
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
    if (!form.name || !form.initial || !form.staffNo || !form.email) {
      toast.error("Please fill in all fields");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Staff Records</h1>
        {isAdmin && (
          <button
            onClick={() => (showForm ? cancelForm() : setShowForm(true))}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
          >
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        )}
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
                Staff No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.staffNo}
                onChange={(e) => setForm({ ...form, staffNo: e.target.value })}
                maxLength={10}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Initial</th>
              <th className="px-4 py-3 text-left font-medium">Staff No</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No staff records found
                </td>
              </tr>
            ) : (
              staffList.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-t border-gray-100 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  } hover:bg-blue-50/50 transition-colors`}
                >
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 font-mono">{s.initial}</td>
                  <td className="px-4 py-3">{s.staffNo}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-center">
                    {isAdmin ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
