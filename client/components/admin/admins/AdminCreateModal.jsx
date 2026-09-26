"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    UserPlus,
    Eye,
    EyeOff,
    ShieldCheck,
} from "lucide-react";

import AdminDropdown from "@/components/admin/ui/AdminDropdown";


export default function AdminCreateModal({
    open = false,
    onClose,
    onSubmit,
    actionLoading = false,
    canAssignSuperAdmin = false,
}) {

    const [formData, setFormData] = useState({

        fullName: "",

        username: "",

        email: "",

        mobile: "",

        password: "",

        role: "admin",

    });


    const [showPassword, setShowPassword] =
        useState(false);


    const [errors, setErrors] =
        useState({});


    /*
     * ==================================================
     * RESET FORM
     * ==================================================
     */

    useEffect(() => {

        if (!open) {

            setFormData({

                fullName: "",

                username: "",

                email: "",

                mobile: "",

                password: "",

                role: "admin",

            });

            setErrors({});

            setShowPassword(false);

        }

    }, [open]);


    /*
     * ==================================================
     * HANDLE CHANGE
     * ==================================================
     */

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


        setErrors(
            (current) => ({

                ...current,

                [name]: "",

            })
        );

    };


    /*
     * ==================================================
     * VALIDATE
     * ==================================================
     */

    const validate = () => {

        const nextErrors = {};


        if (
            !formData.fullName.trim()
        ) {

            nextErrors.fullName =
                "Full name is required.";

        }


        if (
            !formData.username.trim()
        ) {

            nextErrors.username =
                "Username is required.";

        }


        if (
            !formData.email.trim()
        ) {

            nextErrors.email =
                "Email is required.";

        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email
            )
        ) {

            nextErrors.email =
                "Enter a valid email.";

        }


        if (
            !formData.password
        ) {

            nextErrors.password =
                "Password is required.";

        } else if (
            formData.password.length < 6
        ) {

            nextErrors.password =
                "Password must be at least 6 characters.";

        }


        if (
            formData.mobile &&
            !/^[0-9]{10,15}$/.test(
                formData.mobile
            )
        ) {

            nextErrors.mobile =
                "Enter a valid mobile number.";

        }


        setErrors(
            nextErrors
        );


        return (
            Object.keys(
                nextErrors
            ).length === 0
        );

    };


    /*
     * ==================================================
     * SUBMIT
     * ==================================================
     */

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        if (actionLoading) {
            return;
        }


        if (!validate()) {
            return;
        }


        try {

            await onSubmit?.(
                formData
            );

        } catch (
        error
        ) {

            setErrors({

                submit:
                    error?.message ||
                    "Unable to create admin.",

            });

        }

    };


    /*
     * ==================================================
     * CLOSE
     * ==================================================
     */

    const handleClose = () => {

        if (actionLoading) {
            return;
        }

        onClose?.();

    };


    if (!open) {
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

        ...(canAssignSuperAdmin
            ? [{ value: "super_admin", label: "Super Admin" }]
            : []),

    ];


    return (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* ==================================================
                BACKDROP
            ================================================== */}

            <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />


            {/* ==================================================
                MODAL
            ================================================== */}

            <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d101d] shadow-2xl shadow-black/50">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">

                            <UserPlus
                                size={18}
                                className="text-purple-400"
                            />

                        </div>


                        <div>

                            <h2 className="text-base font-bold text-white">
                                Create Admin
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-600">
                                Create a new administrator account
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


                        {/* ==================================================
                            ERROR
                        ================================================== */}

                        {errors.submit && (

                            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">

                                <p className="text-xs font-medium text-red-400">
                                    {errors.submit}
                                </p>

                            </div>

                        )}


                        {/* ==================================================
                            BASIC INFORMATION
                        ================================================== */}

                        <div>

                            <div className="mb-3 flex items-center gap-2">

                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />

                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                    Basic Information
                                </p>

                            </div>


                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                                {/* FULL NAME */}

                                <Field
                                    label="Full Name"
                                    name="fullName"
                                    value={
                                        formData.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter full name"
                                    error={
                                        errors.fullName
                                    }
                                />


                                {/* USERNAME */}

                                <Field
                                    label="Username"
                                    name="username"
                                    value={
                                        formData.username
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter username"
                                    error={
                                        errors.username
                                    }
                                />


                                {/* EMAIL */}

                                <Field
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="admin@example.com"
                                    error={
                                        errors.email
                                    }
                                />


                                {/* MOBILE */}

                                <Field
                                    label="Mobile"
                                    name="mobile"
                                    value={
                                        formData.mobile
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="10-15 digit mobile"
                                    error={
                                        errors.mobile
                                    }
                                />


                            </div>

                        </div>


                        {/* ==================================================
                            PASSWORD
                        ================================================== */}

                        <div>

                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                Password
                            </label>


                            <div className="relative">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Minimum 6 characters"
                                    disabled={
                                        actionLoading
                                    }
                                    className={`h-11 w-full rounded-xl border bg-[#070914] px-3 pr-11 text-sm text-slate-300 outline-none transition placeholder:text-slate-500 ${errors.password
                                        ? "border-red-500/30 focus:border-red-500/50"
                                        : "border-white/[0.07] focus:border-purple-500/30"
                                        }`}
                                />


                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) =>
                                                !current
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                                >

                                    {showPassword ? (

                                        <EyeOff
                                            size={16}
                                        />

                                    ) : (

                                        <Eye
                                            size={16}
                                        />

                                    )}

                                </button>

                            </div>


                            {errors.password && (

                                <p className="mt-1.5 text-[11px] text-red-400">
                                    {errors.password}
                                </p>

                            )}

                        </div>


                        {/* ==================================================
                            ROLE
                        ================================================== */}

                        <div>

                            <div className="mb-3 flex items-center gap-2">

                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />

                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                    Account Settings
                                </p>

                            </div>


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

                                {!canAssignSuperAdmin && (

                                    <p className="mt-1.5 text-[10px] text-slate-500">
                                        Only a super admin can create another super admin.
                                    </p>

                                )}

                            </div>

                        </div>


                        {/* ==================================================
                            VERIFICATION NOTE
                        ================================================== */}

                        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">

                                <ShieldCheck
                                    size={15}
                                    className="text-blue-400"
                                />

                            </div>


                            <div>

                                <p className="text-xs font-semibold text-slate-300">
                                    Every action is audited
                                </p>

                                <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
                                    Creating an admin account records who created it, when, and with what role in the audit log.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0b0e19] px-5 py-4 sm:px-6">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={
                                actionLoading
                            }
                            className="h-10 rounded-xl border border-white/[0.07] px-4 text-xs font-semibold text-slate-500 transition hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={
                                actionLoading
                            }
                            className="flex h-10 min-w-[120px] items-center justify-center rounded-xl bg-purple-600 px-4 text-xs font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {actionLoading
                                ? "Creating..."
                                : "Create Admin"
                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}


/*
|--------------------------------------------------------------------------
| FIELD COMPONENT
|--------------------------------------------------------------------------
*/

function Field({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
}) {

    return (

        <div>

            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                {label}
            </label>


            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`h-11 w-full rounded-xl border bg-[#070914] px-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-500 ${error
                    ? "border-red-500/30 focus:border-red-500/50"
                    : "border-white/[0.07] focus:border-purple-500/30"
                    }`}
            />


            {error && (

                <p className="mt-1.5 text-[11px] text-red-400">
                    {error}
                </p>

            )}

        </div>

    );

}
