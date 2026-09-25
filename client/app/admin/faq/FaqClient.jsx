"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, HelpCircle, FolderPlus, Eye, EyeOff } from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import AdminTable, { AdminTableRow, AdminTableCell } from "../../../components/admin/ui/AdminTable";
import AdminBadge from "../../../components/admin/ui/AdminBadge";

import {
    getAdminFaqCategories,
    createFaqCategory,
    updateFaqCategory,
    deleteFaqCategory,
    getAdminFaqItems,
    createFaqItem,
    updateFaqItem,
    deleteFaqItem,
} from "../../../lib/adminApi";

const ICON_OPTIONS = [
    "help-circle", "user-circle", "wallet", "credit-card", "gamepad", "gift", "shield-check", "life-buoy",
];

export default function AdminFaqPage() {

    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
    const [itemModal, setItemModal] = useState({ open: false, item: null });

    const load = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const [categoriesResponse, itemsResponse] = await Promise.all([
                getAdminFaqCategories(),
                getAdminFaqItems(),
            ]);

            setCategories(categoriesResponse?.data || []);
            setItems(itemsResponse?.data || []);

        } catch (err) {

            setError(err.message || "Unable to load FAQ data.");

        } finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // ==================================================
    // CATEGORY ACTIONS
    // ==================================================

    const handleSaveCategory = async (formData) => {

        setActionLoading(true);

        try {

            if (categoryModal.category) {
                await updateFaqCategory(categoryModal.category._id, formData);
            } else {
                await createFaqCategory(formData);
            }

            setCategoryModal({ open: false, category: null });
            await load();

        } catch (err) {

            alert(err.message || "Unable to save category.");

        } finally {

            setActionLoading(false);

        }

    };

    const handleToggleCategory = async (category) => {

        setActionLoading(true);

        try {
            await updateFaqCategory(category._id, { isActive: !category.isActive });
            await load();
        } catch (err) {
            alert(err.message || "Unable to update category.");
        } finally {
            setActionLoading(false);
        }

    };

    const handleDeleteCategory = async (category) => {

        if (!confirm(`Delete category "${category.name}"? This also deletes all ${category.itemCount || 0} question(s) in it.`)) {
            return;
        }

        setActionLoading(true);

        try {
            await deleteFaqCategory(category._id);
            await load();
        } catch (err) {
            alert(err.message || "Unable to delete category.");
        } finally {
            setActionLoading(false);
        }

    };

    // ==================================================
    // ITEM ACTIONS
    // ==================================================

    const handleSaveItem = async (formData) => {

        setActionLoading(true);

        try {

            if (itemModal.item) {
                await updateFaqItem(itemModal.item._id, formData);
            } else {
                await createFaqItem(formData);
            }

            setItemModal({ open: false, item: null });
            await load();

        } catch (err) {

            alert(err.message || "Unable to save question.");

        } finally {

            setActionLoading(false);

        }

    };

    const handleToggleItem = async (item) => {

        setActionLoading(true);

        try {
            await updateFaqItem(item._id, { isActive: !item.isActive });
            await load();
        } catch (err) {
            alert(err.message || "Unable to update question.");
        } finally {
            setActionLoading(false);
        }

    };

    const handleDeleteItem = async (item) => {

        if (!confirm(`Delete this question?\n\n"${item.question}"`)) {
            return;
        }

        setActionLoading(true);

        try {
            await deleteFaqItem(item._id);
            await load();
        } catch (err) {
            alert(err.message || "Unable to delete question.");
        } finally {
            setActionLoading(false);
        }

    };

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader title="FAQ Management" subtitle="Categories & Questions" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={HelpCircle}
                    eyebrow="Categories & Questions"
                    title="FAQ Management"
                    description="Manage the public FAQ page's categories, questions and display order."
                />

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* CATEGORIES */}

                <AdminTable
                    title="FAQ Categories"
                    subtitle={`${categories.length} categories`}
                    count={categories.length}
                    icon={<FolderPlus size={18} />}
                    headers={[
                        { key: "name", label: "Name" },
                        { key: "icon", label: "Icon" },
                        { key: "order", label: "Order" },
                        { key: "questions", label: "Questions" },
                        { key: "status", label: "Status" },
                        { key: "actions", label: "Actions" },
                    ]}
                    empty={!loading && categories.length === 0}
                    emptyTitle="No categories yet"
                    emptyMessage="Create your first FAQ category to get started."
                    minWidth="900px"
                    headerAction={
                        <button
                            type="button"
                            onClick={() => setCategoryModal({ open: true, category: null })}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500"
                        >
                            <Plus size={14} /> Add Category
                        </button>
                    }
                >
                    {categories.map((category) => (
                        <AdminTableRow key={category._id}>
                            <AdminTableCell className="font-semibold text-white">{category.name}</AdminTableCell>
                            <AdminTableCell className="text-slate-500">{category.icon}</AdminTableCell>
                            <AdminTableCell className="text-slate-500">{category.order}</AdminTableCell>
                            <AdminTableCell className="text-slate-400">{category.itemCount || 0}</AdminTableCell>
                            <AdminTableCell>
                                <AdminBadge variant={category.isActive ? "success" : "default"}>
                                    {category.isActive ? "Active" : "Disabled"}
                                </AdminBadge>
                            </AdminTableCell>
                            <AdminTableCell>
                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={actionLoading} onClick={() => handleToggleCategory(category)} title={category.isActive ? "Disable" : "Enable"} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:text-white disabled:opacity-40">
                                        {category.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button type="button" disabled={actionLoading} onClick={() => setCategoryModal({ open: true, category })} title="Edit" className="rounded-lg border border-violet-500/20 bg-violet-500/[0.05] p-2 text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-40">
                                        <Pencil size={14} />
                                    </button>
                                    <button type="button" disabled={actionLoading} onClick={() => handleDeleteCategory(category)} title="Delete" className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-40">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </AdminTableCell>
                        </AdminTableRow>
                    ))}
                </AdminTable>

                {/* ITEMS */}

                <AdminTable
                    title="FAQ Questions"
                    subtitle={`${items.length} questions`}
                    count={items.length}
                    icon={<HelpCircle size={18} />}
                    headers={[
                        { key: "category", label: "Category" },
                        { key: "question", label: "Question" },
                        { key: "order", label: "Order" },
                        { key: "status", label: "Status" },
                        { key: "actions", label: "Actions" },
                    ]}
                    empty={!loading && items.length === 0}
                    emptyTitle="No questions yet"
                    emptyMessage="Create a category first, then add questions to it."
                    minWidth="1000px"
                    headerAction={
                        <button
                            type="button"
                            disabled={categories.length === 0}
                            onClick={() => setItemModal({ open: true, item: null })}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40"
                        >
                            <Plus size={14} /> Add Question
                        </button>
                    }
                >
                    {items.map((item) => (
                        <AdminTableRow key={item._id}>
                            <AdminTableCell className="text-slate-400">{item.category?.name || "-"}</AdminTableCell>
                            <AdminTableCell className="max-w-[380px] truncate text-white">{item.question}</AdminTableCell>
                            <AdminTableCell className="text-slate-500">{item.order}</AdminTableCell>
                            <AdminTableCell>
                                <AdminBadge variant={item.isActive ? "success" : "default"}>
                                    {item.isActive ? "Active" : "Disabled"}
                                </AdminBadge>
                            </AdminTableCell>
                            <AdminTableCell>
                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={actionLoading} onClick={() => handleToggleItem(item)} title={item.isActive ? "Disable" : "Enable"} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:text-white disabled:opacity-40">
                                        {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button type="button" disabled={actionLoading} onClick={() => setItemModal({ open: true, item })} title="Edit" className="rounded-lg border border-violet-500/20 bg-violet-500/[0.05] p-2 text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-40">
                                        <Pencil size={14} />
                                    </button>
                                    <button type="button" disabled={actionLoading} onClick={() => handleDeleteItem(item)} title="Delete" className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-40">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </AdminTableCell>
                        </AdminTableRow>
                    ))}
                </AdminTable>

            </div>

            {categoryModal.open && (
                <CategoryModal
                    category={categoryModal.category}
                    actionLoading={actionLoading}
                    onClose={() => setCategoryModal({ open: false, category: null })}
                    onSave={handleSaveCategory}
                />
            )}

            {itemModal.open && (
                <ItemModal
                    item={itemModal.item}
                    categories={categories}
                    actionLoading={actionLoading}
                    onClose={() => setItemModal({ open: false, item: null })}
                    onSave={handleSaveItem}
                />
            )}

        </main>
    );
}


function CategoryModal({ category, actionLoading, onClose, onSave }) {

    const [name, setName] = useState(category?.name || "");
    const [icon, setIcon] = useState(category?.icon || "help-circle");
    const [order, setOrder] = useState(category?.order ?? 0);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d101d] p-5 shadow-2xl">
                <h2 className="text-base font-bold text-white">{category ? "Edit Category" : "New Category"}</h2>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Icon</label>
                        <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60">
                            {ICON_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Display Order</label>
                        <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={actionLoading} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-40">Cancel</button>
                    <button type="button" onClick={() => onSave({ name, icon, order: Number(order) })} disabled={actionLoading || !name.trim()} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">
                        {actionLoading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );

}


function ItemModal({ item, categories, actionLoading, onClose, onSave }) {

    const [category, setCategory] = useState(item?.category?._id || item?.category || categories[0]?._id || "");
    const [question, setQuestion] = useState(item?.question || "");
    const [answer, setAnswer] = useState(item?.answer || "");
    const [order, setOrder] = useState(item?.order ?? 0);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d101d] p-5 shadow-2xl">
                <h2 className="text-base font-bold text-white">{item ? "Edit Question" : "New Question"}</h2>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60">
                            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Question</label>
                        <input value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Answer</label>
                        <textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Display Order</label>
                        <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#050a19] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500/60" />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={actionLoading} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-40">Cancel</button>
                    <button type="button" onClick={() => onSave({ category, question, answer, order: Number(order) })} disabled={actionLoading || !question.trim() || !answer.trim()} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-40">
                        {actionLoading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );

}
