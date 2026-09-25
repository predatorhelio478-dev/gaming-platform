"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Plus, RefreshCw, Trash2, Pencil } from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import {
    getAdminAdmins,
    createAdminAccount,
    updateAdminAccount,
    deactivateAdminAccount,
    getCurrentAdmin,
} from "../../../lib/adminApi";

const ROLES = ["super_admin", "admin", "operator"];

function RoleBadge({ role }) {
    const styles = {
        super_admin: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
        admin: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        operator: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    };

    return (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[role] || styles.operator}`}>
            {role?.replace("_", " ")}
        </span>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value ?? 0}</p>
        </div>
    );
}

export default function AdminsPage() {

    const [me, setMe] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [counts, setCounts] = useState({ total: 0, super_admin: 0, admin: 0, operator: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [meResponse, listResponse] = await Promise.all([
                getCurrentAdmin(),
                getAdminAdmins({ search, role: roleFilter }),
            ]);

            setMe(meResponse?.admin || null);
            setAdmins(listResponse?.admins || []);
            setCounts(listResponse?.counts || { total: 0, super_admin: 0, admin: 0, operator: 0 });
        } catch (err) {
            setError(err.message || "Unable to load admins.");
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const isSuperAdmin = me?.role === "super_admin";

    return (
        <div className="min-h-screen">
            <AdminHeader title="Admins" subtitle="Manage administrator accounts" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total Admin Accounts" value={counts.total} />
                    <StatCard label="Super Admins" value={counts.super_admin} />
                    <StatCard label="Admins" value={counts.admin} />
                    <StatCard label="Operators" value={counts.operator} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search name/username/email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="rounded-xl border border-white/10 bg-[#050a19] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60"
                        />

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-xl border border-white/10 bg-[#050a19] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60"
                        >
                            <option value="all">All roles</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>{r.replace("_", " ")}</option>
                            ))}
                        </select>

                        <button type="button" onClick={load} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white hover:brightness-110"
                    >
                        <Plus size={16} /> New Admin
                    </button>
                </div>

                {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

                <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Name / Username</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No admin accounts found.</td></tr>
                            ) : admins.map((admin) => {

                                const isSelf = String(admin._id) === String(me?._id);
                                const targetIsSuperAdmin = admin.role === "super_admin";
                                const canManage = isSuperAdmin || !targetIsSuperAdmin;

                                return (
                                    <tr key={admin._id} className="hover:bg-white/[0.02]">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{admin.fullName}</div>
                                            <div className="text-xs text-slate-500">@{admin.username}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{admin.email}</td>
                                        <td className="px-4 py-3 text-slate-300">{admin.mobile || "-"}</td>
                                        <td className="px-4 py-3"><RoleBadge role={admin.role} /></td>
                                        <td className="px-4 py-3">
                                            {admin.isActive
                                                ? <span className="text-emerald-400 text-xs font-bold">Active</span>
                                                : <span className="text-red-400 text-xs font-bold">Deactivated</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={!canManage}
                                                    onClick={() => setEditTarget(admin)}
                                                    title={!canManage ? "Only a super admin can modify another super admin" : "Edit"}
                                                    className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isSelf || !canManage}
                                                    onClick={() => setDeleteTarget(admin)}
                                                    title={isSelf ? "You cannot delete your own account" : !canManage ? "Only a super admin can delete another super admin" : "Deactivate"}
                                                    className="rounded-lg border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );

                            })}
                        </tbody>
                    </table>
                </div>

            </div>

            {showCreate && (
                <CreateAdminModal
                    canCreateSuperAdmin={isSuperAdmin}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); load(); }}
                />
            )}

            {editTarget && (
                <EditAdminModal
                    admin={editTarget}
                    canAssignSuperAdmin={isSuperAdmin}
                    onClose={() => setEditTarget(null)}
                    onSaved={() => { setEditTarget(null); load(); }}
                />
            )}

            {deleteTarget && (
                <ConfirmDeleteModal
                    admin={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirmed={() => { setDeleteTarget(null); load(); }}
                />
            )}

        </div>
    );
}

function ModalShell({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1020] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50";

function CreateAdminModal({ canCreateSuperAdmin, onClose, onCreated }) {

    const [form, setForm] = useState({ fullName: "", username: "", email: "", mobile: "", password: "", role: "admin" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        try {
            setBusy(true);
            await createAdminAccount(form);
            onCreated();
        } catch (err) {
            setError(err.message || "Unable to create admin.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title="Create Admin Account" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
                <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} disabled={busy} className={inputClass} required />
                <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={busy} className={inputClass} required />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={busy} className={inputClass} required />
                <input placeholder="Mobile (optional)" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} disabled={busy} className={inputClass} />
                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={busy} className={inputClass} required />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={busy} className={inputClass}>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                    {canCreateSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
                    {busy ? "Creating..." : "Create Admin"}
                </button>
            </form>
        </ModalShell>
    );
}

function EditAdminModal({ admin, canAssignSuperAdmin, onClose, onSaved }) {

    const [role, setRole] = useState(admin.role);
    const [isActive, setIsActive] = useState(admin.isActive);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        try {
            setBusy(true);
            await updateAdminAccount(admin._id, { role, isActive });
            onSaved();
        } catch (err) {
            setError(err.message || "Unable to update admin.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title={`Edit ${admin.fullName}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
                <label className="mb-1 block text-xs font-medium text-slate-400">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} disabled={busy} className={inputClass}>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin" disabled={!canAssignSuperAdmin && role !== "super_admin"}>Super Admin</option>
                </select>
                <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                    Active
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={busy} />
                </label>
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
                    {busy ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </ModalShell>
    );
}

function ConfirmDeleteModal({ admin, onClose, onConfirmed }) {

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        setError("");

        try {
            setBusy(true);
            await deactivateAdminAccount(admin._id);
            onConfirmed();
        } catch (err) {
            setError(err.message || "Unable to deactivate admin.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title="Deactivate Admin Account" onClose={onClose}>
            <p className="mb-4 text-sm text-slate-400">
                Deactivate <span className="font-semibold text-white">{admin.fullName}</span> (@{admin.username})? They will no longer be able to log in.
            </p>
            {error && <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
            <div className="flex gap-2">
                <button type="button" onClick={handleConfirm} disabled={busy} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50">
                    {busy ? "Deactivating..." : "Deactivate"}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white">
                    Cancel
                </button>
            </div>
        </ModalShell>
    );
}
