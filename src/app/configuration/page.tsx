"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SystemCode {
  id: number;
  type: string;
  value: string;
}

const emptyForm = { type: "PREFIX", value: "" };

export default function ConfigurationPage() {
  const [codes, setCodes] = useState<SystemCode[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchCodes() {
    const res = await fetch("/api/system-code");
    setCodes(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchCodes();
    fetch("/api/accounts/check-role")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  function startEdit(code: SystemCode) {
    setForm({ type: code.type, value: code.value });
    setEditingId(code.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.value) {
      toast.error("Please fill in all fields");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    const res = await fetch("/api/system-code", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Failed to save configuration");
      return;
    }

    toast.success(editingId ? "Configuration updated" : "Configuration created");
    cancelForm();
    fetchCodes();
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    await fetch(`/api/system-code?id=${id}`, { method: "DELETE" });
    toast.success("Configuration deleted");
    fetchCodes();
  }

  const grouped = codes.reduce(
    (acc, code) => {
      if (!acc[code.type]) acc[code.type] = [];
      acc[code.type].push(code);
      return acc;
    },
    {} as Record<string, SystemCode[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Configuration</h1>
        {isAdmin && (
          <button
            onClick={() => (showForm ? cancelForm() : setShowForm(true))}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
          >
            {showForm ? "Cancel" : "+ Add Configuration"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">
            {editingId ? "Edit Configuration" : "New Configuration"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              >
                <option value="PREFIX">PREFIX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                maxLength={20}
                placeholder="e.g. ADA"
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

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No configurations found. Add a PREFIX to get started.
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div
            key={type}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-[#1e3a5f]">{type}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                  <th className="px-4 py-2 text-center font-medium w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((code, i) => (
                  <tr
                    key={code.id}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono">{code.value}</td>
                    <td className="px-4 py-3 text-center">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => startEdit(code)}
                            className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
