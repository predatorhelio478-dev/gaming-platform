"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    UserCog,
    Save,
} from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";


// ======================================================
// ADMIN EDIT MODAL
// ======================================================

export default function AdminEditModal({
    open = false,
    admin = null,
    actionLoading = false,
    canAssignSuperAdmin = false,
    onClose,
    onSubmit,
}) {

    const [formData, setFormData] =
        useState({

            fullName: "",
            username: "",
            email: "",
            mobile: "",
            role: "admin",
            status: "active",

        });


    const [error, setError] =
        useState("");


    // ==================================================
    // LOAD ADMIN DATA
    // ==================================================

    useEffect(() => {

        if (!admin) {

            setFormData({

                fullName: "",
                username: "",
                email: "",
                mobile: "",
                role: "admin",
                status: "active",

            });

            return;

        }


        setFormData({

            fullName:
                admin?.fullName ||
                "",

            username:
                admin?.username ||
                "",

            email:
                admin?.email ||
                "",

            mobile:
                admin?.mobile ||
                "",

            role:
                admin?.role ||
                "admin",

            status:
                admin?.isActive === false
                    ? "deactivated"
                    : "active",

        });


        setError("");

    }, [admin, open]);


    // ==================================================
    // CLOSE
    // ==================================================

    const handleClose = () => {

        if (actionLoading) {
            return;
        }

        setError("");

        onClose?.();

    };


    // ==================================================
    // CHANGE
    // ==================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            (current) => ({

                ...current,

                [name]:
                    value,

            })
        );

    };


    // ==================================================
    // SUBMIT
    // ==================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        if (actionLoading) {
            return;
        }


        setError("");


        if (
            !formData.fullName.trim()
        ) {

            setError(
                "Full name is required."
            );

            return;

        }


        if (
            canAssignSuperAdmin &&
            (!formData.username.trim() || !formData.email.trim())
        ) {

            setError(
                "Username and email are required."
            );

            return;

        }


        try {

            await onSubmit?.({

                fullName:
                    formData.fullName.trim(),

                mobile:
                    formData.mobile.trim(),

                role:
                    formData.role,

                isActive:
                    formData.status !== "deactivated",

                // Only a super admin may change these - omitted
                // entirely (not just disabled) for anyone else,
                // so a regular admin's request never even
                // attempts to touch them. Server-side enforces
                // the same restriction independently.
                ...(canAssignSuperAdmin
                    ? {
                        username: formData.username.trim(),
                        email: formData.email.trim(),
                    }
                    : {}),

            });

        } catch (
        submitError
        ) {

            setError(
                submitError?.message ||
                "Unable to update admin."
            );

        }

    };


    if (
        !open ||
        !admin
    ) {
        return null;
    }


    const roleOptions = [

        {
            value: "operator",
            label: "Operator",
        },

        {
            value: "admin",
            label: "Admin",
        },

        ...(canAssignSuperAdmin || admin?.role === "super_admin"
            ? [{ value: "super_admin", label: "Super Admin" }]
            : []),

    ];


    return (

        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/70
                p-4
            "
        >

            {/* ==================================================
                MODAL
            ================================================== */}

            <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d101d] shadow-2xl shadow-black/50">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">

                            <UserCog
                                size={18}
                                className="text-purple-400"
                            />

                        </div>


                        <div>

                            <h2 className="text-base font-bold text-white">
                                Edit Admin
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-600">
                                {admin?.fullName || admin?.username}
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <X
                            size={18}
                        />

                    </button>

                </div>


                {/* ==================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto"
                >

                    <div className="space-y-5 p-5 sm:p-6">

                        {error && (

                            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">

                                <p className="text-xs font-medium text-red-400">
                                    {error}
                                </p>

                            </div>

                        )}


                        {/* =================================================
                            IDENTITY (Super Admin only can edit)
                        ================================================== */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={
                                        canAssignSuperAdmin
                                            ? formData.username
                                            : (admin?.username || "")
                                    }
                                    onChange={handleChange}
                                    disabled={!canAssignSuperAdmin || actionLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-300 outline-none transition focus:border-purple-500/30 disabled:text-slate-500 disabled:opacity-70"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        canAssignSuperAdmin
                                            ? formData.email
                                            : (admin?.email || "")
                                    }
                                    onChange={handleChange}
                                    disabled={!canAssignSuperAdmin || actionLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-300 outline-none transition focus:border-purple-500/30 disabled:text-slate-500 disabled:opacity-70"
                                />
                            </div>

                        </div>

                        {!canAssignSuperAdmin && (

                            <p className="text-[10px] text-slate-500">
                                Only a super admin can change this account&apos;s username or email.
                            </p>

                        )}


                        {/* =================================================
                            EDITABLE FIELDS
                        ================================================== */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={actionLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-300 outline-none transition focus:border-purple-500/30 disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Mobile
                                </label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    disabled={actionLoading}
                                    placeholder="10-15 digit mobile"
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-500 focus:border-purple-500/30 disabled:opacity-50"
                                />
                            </div>

                        </div>


                        {/* =================================================
                            ROLE / STATUS
                        ================================================== */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Role
                                </label>
                                <AdminDropdown
                                    value={formData.role}
                                    onChange={(value) =>
                                        setFormData((current) => ({
                                            ...current,
                                            role: value,
                                        }))
                                    }
                                    options={roleOptions}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                    Status
                                </label>
                                <AdminDropdown
                                    value={formData.status}
                                    onChange={(value) =>
                                        setFormData((current) => ({
                                            ...current,
                                            status: value,
                                        }))
                                    }
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "deactivated", label: "Deactivated" },
                                    ]}
                                />
                            </div>

                        </div>

                        {!canAssignSuperAdmin && admin?.role !== "super_admin" && (

                            <p className="text-[10px] text-slate-500">
                                Only a super admin can promote this account to Super Admin.
                            </p>

                        )}

                    </div>


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0b0e19] px-5 py-4 sm:px-6">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={actionLoading}
                            className="h-10 rounded-xl border border-white/[0.07] px-4 text-xs font-semibold text-slate-500 transition hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {actionLoading ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Save size={14} />
                                    Save Changes
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}
