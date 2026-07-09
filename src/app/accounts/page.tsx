"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AppUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { name: "", email: "", role: "admin" };

export default function AccountsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  async function fetchUsers() {
    const res = await fetch("/api/accounts");
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function startEdit(user: AppUser) {
    setForm({ name: user.name, email: user.email, role: user.role });
    setEditingId(user.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please fill in all fields");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const body = editingId
      ? { ...form, id: editingId, isActive: true }
      : form;

    const res = await fetch("/api/accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 409) {
      toast.error("A user with this email already exists");
      return;
    }
    if (!res.ok) {
      toast.error("Failed to save user");
      return;
    }

    toast.success(editingId ? "User updated" : "User created");
    cancelForm();
    fetchUsers();
  }

  async function handleDeactivate(id: number) {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    toast.success("User deactivated");
    fetchUsers();
  }

  async function handleReactivate(user: AppUser) {
    const res = await fetch("/api/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, isActive: true }),
    });
    if (res.ok) {
      toast.success("User reactivated");
      fetchUsers();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700">Access Denied</h2>
          <p className="text-gray-500">You do not have permission to access Account Management.</p>
          <p className="text-gray-400 text-sm">Only administrators can manage user accounts.</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Account Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage admin users who can edit Staff Records and Configuration
          </p>
        </div>
        <button
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">
            {editingId ? "Edit User" : "New User"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={100}
                placeholder="e.g. john@company.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="admin">Admin</option>
                <option value="user">User (View Only)</option>
              </select>
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

      {/* Active Users */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-center font-medium">Role</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users found. Add a user to grant admin access.
                </td>
              </tr>
            ) : (
              activeUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-t border-gray-100 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  } hover:bg-blue-50/50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => startEdit(u)}
                      className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Inactive Users</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden opacity-75">
            <table className="w-full text-sm">
              <tbody>
                {inactiveUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-400">{u.name}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        Inactive
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleReactivate(u)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
