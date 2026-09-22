"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Eye, EyeOff, Save, X } from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import AdminTable, { AdminTableRow, AdminTableCell } from "../../../components/admin/ui/AdminTable";
import AdminBadge from "../../../components/admin/ui/AdminBadge";

import {
    getAdminEmailTemplates,
    previewAdminEmailTemplate,
    updateAdminEmailTemplate,
} from "../../../lib/adminApi";

export default function AdminEmailTemplatesPage() {

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editModal, setEditModal] = useState({ open: false, template: null });
    const [previewModal, setPreviewModal] = useState({ open: false, html: "", subject: "" });
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getAdminEmailTemplates();

            setTemplates(response?.data || []);

        } catch (err) {

            setError(err.message || "Unable to load email templates.");

        } finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleToggle = async (template) => {

        setActionLoading(true);

        try {
            await updateAdminEmailTemplate(template.key, { isActive: !template.isActive });
            await load();
        } catch (err) {
            alert(err.message || "Unable to update template.");
        } finally {
            setActionLoading(false);
        }

    };

    const handlePreview = async (template) => {

        try {

            const response = await previewAdminEmailTemplate(template.key);

            setPreviewModal({ open: true, html: response?.data?.html || "", subject: response?.data?.subject || "" });

        } catch (err) {

            alert(err.message || "Unable to preview template.");

        }

    };

    const handleSave = async (formData) => {

        setActionLoading(true);

        try {

            await updateAdminEmailTemplate(editModal.template.key, formData);
            setEditModal({ open: false, template: null });
            await load();

        } catch (err) {

            alert(err.message || "Unable to save template.");

        } finally {

            setActionLoading(false);

        }

    };

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader title="Email Templates" subtitle="System Emails" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={Mail}
                    eyebrow="System Emails"
                    title="Email Templates"
                    description="Manage the subject/body content and enable/disable state of every system email template."
                />

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <AdminTable
                    title="All Templates"
                    subtitle="Email Templates"
                    count={templates.length}
                    icon={<Mail size={18} />}
                    headers={[
                        { key: "name", label: "Template" },
                        { key: "subject", label: "Subject" },
                        { key: "status", label: "Status" },
                        { key: "updated", label: "Last Updated" },
                        { key: "actions", label: "Actions" },
                    ]}
                    empty={!loading && templates.length === 0}
                    emptyTitle="No templates found"
                    emptyMessage="Email templates are seeded automatically on server start."
                    minWidth="1100px"
                >
                    {templates.map((template) => (
                        <AdminTableRow key={template.key}>
                            <AdminTableCell>
                                <p className="font-semibold text-white">{template.name}</p>
                                <p className="mt-0.5 text-[11px] text-slate-600">{template.description}</p>
                            </AdminTableCell>
                            <AdminTableCell className="max-w-[280px] truncate text-slate-400">{template.subject}</AdminTableCell>
                            <AdminTableCell>
                                <AdminBadge variant={template.isActive ? "success" : "default"}>
                                    {template.isActive ? "Active" : "Disabled"}
                                </AdminBadge>
                            </AdminTableCell>
                            <AdminTableCell className="text-slate-500">
                                {template.updatedAt ? new Date(template.updatedAt).toLocaleString("en-IN") : "-"}
                            </AdminTableCell>
                            <AdminTableCell>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => handlePreview(template)} title="Preview" className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:text-white">
                                        <Mail size={14} />
                                    </button>
                                    <button type="button" disabled={actionLoading} onClick={() => handleToggle(template)} title={template.isActive ? "Disable" : "Enable"} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:text-white disabled:opacity-40">
                                        {template.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button type="button" onClick={() => setEditModal({ open: true, template })} className="rounded-lg border border-violet-500/20 bg-violet-500/[0.05] px-3 py-2 text-xs font-bold text-violet-400 transition hover:bg-violet-500/10">
                                        Edit
                                    </button>
                                </div>
                            </AdminTableCell>
                        </AdminTableRow>
                    ))}
                </AdminTable>

            </div>

            {editModal.open && (
                <EditTemplateModal
                    template={editModal.template}
                    actionLoading={actionLoading}
                    onClose={() => setEditModal({ open: false, template: null })}
                    onSave={handleSave}
                />
            )}

            {previewModal.open && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d101d] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                            <div>
                                <h2 className="text-sm font-bold text-white">Preview</h2>
                                <p className="text-xs text-slate-500">{previewModal.subject}</p>
                            </div>
                            <button type="button" onClick={() => setPreviewModal({ open: false, html: "", subject: "" })} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <iframe
                            title="Email preview"
                            srcDoc={previewModal.html}
                            className="h-[500px] w-full bg-white"
                        />
                    </div>
                </div>
            )}

        </main>
    );
}


function EditTemplateModal({ template, actionLoading, onClose, onSave }) {

    const [subject, setSubject] = useState(template.subject);
    const [body, setBody] = useState(template.body);
    const [ctaText, setCtaText] = useState(template.ctaText || "");

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0d101d] p-5 shadow-2xl">

                <h2 className="text-base font-bold text-white">Edit: {template.name}</h2>

                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                    Available variables: {template.variables?.map((v) => `{{${v}}}`).join(", ") || "none"}
                </p>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Subject</label>
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Body</label>
                        <textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">CTA Button Text (optional)</label>
                        <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="e.g. Log In" className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={actionLoading} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-40">Cancel</button>
                    <button type="button" onClick={() => onSave({ subject, body, ctaText })} disabled={actionLoading || !subject.trim() || !body.trim()} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">
                        <Save size={14} />
                        {actionLoading ? "Saving..." : "Save"}
                    </button>
                </div>

            </div>
        </div>
    );

}
