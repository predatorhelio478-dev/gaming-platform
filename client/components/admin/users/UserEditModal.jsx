"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    UserRound,
    Mail,
    Phone,
    Shield,
    Save,
    KeyRound,
    Eye,
    EyeOff,
} from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";


// ======================================================
// USER EDIT MODAL
// ======================================================

export default function UserEditModal({
    open = false,
    user = null,
    actionLoading = false,
    canManuallyVerify = false,
    onClose,
    onSubmit,
    onChangePassword,
    onRequestVerification,
}) {

    const [formData, setFormData] =
        useState({

            fullName: "",
            username: "",
            email: "",
            mobile: "",
            role: "user",
            status: "active",

        });


    const [error, setError] =
        useState("");


    // ==================================================
    // NOTIFY USER ON CONTACT CHANGE (only takes effect if
    // email and/or mobile actually changes in this submit)
    // ==================================================

    const [notifyEmail, setNotifyEmail] =
        useState(false);


    // ==================================================
    // CHANGE PASSWORD (separate action from profile edit)
    // ==================================================

    const [newPassword, setNewPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [passwordError, setPasswordError] =
        useState("");

    const [passwordSuccess, setPasswordSuccess] =
        useState("");

    const [changingPassword, setChangingPassword] =
        useState(false);


    // ==================================================
    // LOAD USER DATA
    // ==================================================

    useEffect(() => {

        if (!user) {

            setFormData({

                fullName: "",
                username: "",
                email: "",
                mobile: "",
                role: "user",
                status: "active",

            });

            return;

        }


        setFormData({

            fullName:
                user?.fullName ||
                "",

            username:
                user?.username ||
                "",

            email:
                user?.email ||
                "",

            mobile:
                user?.mobile ||
                "",

            role:
                user?.role ||
                "user",

            status:
                user?.status ||
                "active",

        });


        setError("");

        setNotifyEmail(false);

        setNewPassword("");

        setShowPassword(false);

        setPasswordError("");

        setPasswordSuccess("");

    }, [user, open]);


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
            type,
            checked,
        } = event.target;


        setFormData(
            (current) => ({

                ...current,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,

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
            !formData.username.trim()
        ) {

            setError(
                "Username is required."
            );

            return;

        }


        if (
            !formData.email.trim()
        ) {

            setError(
                "Email is required."
            );

            return;

        }


        try {

            await onSubmit?.({

                fullName:
                    formData.fullName.trim(),

                username:
                    formData.username.trim(),

                email:
                    formData.email.trim(),

                mobile:
                    formData.mobile.trim(),

                role:
                    formData.role,

                status:
                    formData.status,

                notifyEmail,

            });

        } catch (
        submitError
        ) {

            setError(
                submitError?.message ||
                "Unable to update user."
            );

        }

    };


    // ==================================================
    // CHANGE PASSWORD SUBMIT
    // ==================================================

    const handleChangePassword = async (
        event
    ) => {

        event.preventDefault();


        if (changingPassword || actionLoading) {
            return;
        }


        setPasswordError("");

        setPasswordSuccess("");


        if (
            !newPassword ||
            newPassword.length < 6
        ) {

            setPasswordError(
                "New password must be at least 6 characters."
            );

            return;

        }


        try {

            setChangingPassword(true);

            await onChangePassword?.(newPassword);

            setNewPassword("");

            setShowPassword(false);

            setPasswordSuccess(
                "Password changed successfully."
            );

        } catch (changePasswordError) {

            setPasswordError(
                changePasswordError?.message ||
                "Unable to change password."
            );

        } finally {

            setChangingPassword(false);

        }

    };


    if (!open) {
        return null;
    }


    const isNormalUser =
        user?.role !== "admin";


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
                backdrop-blur-sm
            "
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    handleClose();

                }

            }}
        >

            <div
                className="
                    w-full
                    max-w-2xl
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-[#0d101d]
                    shadow-2xl
                "
            >

                {/* =================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-white/[0.06]
                        px-5
                        py-4
                    "
                >

                    <div>

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <UserRound
                                size={17}
                                className="text-purple-400"
                            />

                            <h2
                                className="
                                    text-base
                                    font-bold
                                    text-white
                                "
                            >
                                Edit User
                            </h2>

                        </div>


                        <p
                            className="
                                mt-1
                                text-xs
                                text-slate-500
                            "
                        >
                            Update player account information.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleClose
                        }
                        disabled={
                            actionLoading
                        }
                        className="
                            rounded-lg
                            p-2
                            text-slate-500
                            transition
                            hover:bg-white/[0.05]
                            hover:text-white
                            disabled:opacity-40
                        "
                    >

                        <X
                            size={18}
                        />

                    </button>

                </div>


                {/* =================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="p-5"
                >

                    {error && (

                        <div
                            className="
                                mb-4
                                rounded-xl
                                border
                                border-red-500/20
                                bg-red-500/[0.05]
                                px-4
                                py-3
                                text-xs
                                text-red-300
                            "
                        >
                            {error}
                        </div>

                    )}


                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-4
                            sm:grid-cols-2
                        "
                    >

                        {/* FULL NAME */}

                        <Field
                            label="Full Name"
                            icon={
                                <UserRound
                                    size={14}
                                />
                            }
                        >

                            <input
                                name="fullName"
                                value={
                                    formData.fullName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    actionLoading
                                }
                                className="input"
                                placeholder="Full name"
                            />

                        </Field>


                        {/* USERNAME */}

                        <Field
                            label="Username"
                            icon={
                                <UserRound
                                    size={14}
                                />
                            }
                        >

                            <input
                                name="username"
                                value={
                                    formData.username
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    actionLoading
                                }
                                className="input"
                                placeholder="Username"
                            />

                        </Field>


                        {/* EMAIL */}

                        <Field
                            label="Email"
                            icon={
                                <Mail
                                    size={14}
                                />
                            }
                        >

                            <input
                                type="email"
                                name="email"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    actionLoading
                                }
                                className="input"
                                placeholder="Email address"
                            />

                        </Field>


                        {/* MOBILE */}

                        <Field
                            label="Mobile"
                            icon={
                                <Phone
                                    size={14}
                                />
                            }
                        >

                            <input
                                name="mobile"
                                value={
                                    formData.mobile
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    actionLoading
                                }
                                className="input"
                                placeholder="Mobile number"
                            />

                        </Field>


                        {/* NOTIFY USER OF CONTACT CHANGE */}

                        <label className="-mt-1 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-xs font-medium text-slate-400 select-none">
                            <input
                                type="checkbox"
                                checked={notifyEmail}
                                onChange={(event) => setNotifyEmail(event.target.checked)}
                                disabled={actionLoading}
                                className="h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-[#070914] text-purple-500 focus:ring-purple-500/40 disabled:cursor-not-allowed"
                            />
                            Send notification email to user
                            <span className="text-slate-600">(only if email or mobile is changed)</span>
                        </label>


                        {/* ROLE */}

                        <Field
                            label="Role"
                            icon={
                                <Shield
                                    size={14}
                                />
                            }
                        >

                            <AdminDropdown
                                value={formData.role}
                                onChange={(value) =>
                                    setFormData((current) => ({
                                        ...current,
                                        role: value,
                                    }))
                                }
                                options={[
                                    {
                                        value: "user",
                                        label: "Player",
                                    },
                                    {
                                        value: "admin",
                                        label: "Admin",
                                    },
                                ]}
                            />

                        </Field>


                        {/* STATUS */}

                        <Field
                            label="Status"
                            icon={
                                <Shield
                                    size={14}
                                />
                            }
                        >

                            <AdminDropdown
                                value={formData.status}
                                onChange={(value) =>
                                    setFormData((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                options={[
                                    {
                                        value: "active",
                                        label: "Active",
                                    },
                                    {
                                        value: "blocked",
                                        label: "Blocked",
                                    },
                                ]}
                            />

                        </Field>

                    </div>


                    {/* VERIFICATION STATUS */}

                    <div
                        className="
                            mt-5
                            space-y-2
                            rounded-xl
                            border
                            border-white/[0.06]
                            bg-white/[0.02]
                            px-4
                            py-3
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-semibold
                                    text-white
                                "
                            >
                                Verification status
                            </p>

                            <p
                                className="
                                    mt-0.5
                                    text-[10px]
                                    leading-4
                                    text-slate-600
                                "
                            >
                                {canManuallyVerify
                                    ? "Email and mobile verification are independent - a real OTP is never sent for a manual override."
                                    : "Only a Super Admin can manually verify/unverify - a real OTP is never sent for a manual override."}
                            </p>

                        </div>

                        <div className="flex items-center justify-between gap-2">

                            <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                    user?.emailVerified
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : "border-white/10 bg-white/[0.03] text-slate-500"
                                }`}
                            >
                                Email {user?.emailVerified ? "Verified" : "Unverified"}
                            </span>

                            {canManuallyVerify && (
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => onRequestVerification?.(user, "email", !user?.emailVerified)}
                                    className="text-[11px] font-bold text-purple-400 transition hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {user?.emailVerified ? "Unverify" : "Verify"}
                                </button>
                            )}

                        </div>

                        <div className="flex items-center justify-between gap-2">

                            <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                    user?.mobileVerified
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : "border-white/10 bg-white/[0.03] text-slate-500"
                                }`}
                            >
                                Mobile {user?.mobileVerified ? "Verified" : "Unverified"}
                            </span>

                            {canManuallyVerify && user?.mobile && (
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => onRequestVerification?.(user, "mobile", !user?.mobileVerified)}
                                    className="text-[11px] font-bold text-purple-400 transition hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {user?.mobileVerified ? "Unverify" : "Verify"}
                                </button>
                            )}

                        </div>

                    </div>


                    {/* CHANGE PASSWORD (separate action, normal users only) */}

                    {isNormalUser && (

                        <div
                            className="
                                mt-5
                                rounded-xl
                                border
                                border-white/[0.06]
                                bg-white/[0.02]
                                px-4
                                py-4
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    font-semibold
                                    text-white
                                "
                            >

                                <KeyRound size={14} className="text-purple-400" />

                                Change Password

                            </div>

                            <p
                                className="
                                    mt-0.5
                                    text-[10px]
                                    leading-4
                                    text-slate-600
                                "
                            >
                                Sets a new password for this player directly. This is a separate action from updating the profile above.
                            </p>

                            {passwordError && (

                                <div
                                    className="
                                        mt-3
                                        rounded-lg
                                        border
                                        border-red-500/20
                                        bg-red-500/[0.05]
                                        px-3
                                        py-2
                                        text-[11px]
                                        text-red-300
                                    "
                                >
                                    {passwordError}
                                </div>

                            )}

                            {passwordSuccess && (

                                <div
                                    className="
                                        mt-3
                                        rounded-lg
                                        border
                                        border-emerald-500/20
                                        bg-emerald-500/[0.05]
                                        px-3
                                        py-2
                                        text-[11px]
                                        text-emerald-300
                                    "
                                >
                                    {passwordSuccess}
                                </div>

                            )}

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">

                                <div className="relative flex-1">

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        disabled={changingPassword || actionLoading}
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        className="input pr-16"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((previous) => !previous)}
                                        disabled={changingPassword || actionLoading}
                                        className="
                                            absolute
                                            right-2.5
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-500
                                            transition
                                            hover:text-white
                                            disabled:opacity-40
                                        "
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>

                                </div>

                                <button
                                    type="button"
                                    onClick={handleChangePassword}
                                    disabled={changingPassword || actionLoading}
                                    className="
                                        inline-flex
                                        shrink-0
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-yellow-500/20
                                        bg-yellow-500/[0.08]
                                        px-4
                                        py-2.5
                                        text-xs
                                        font-bold
                                        text-yellow-400
                                        transition
                                        hover:bg-yellow-500/[0.15]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    <KeyRound size={14} />
                                    {changingPassword ? "Changing..." : "Change Password"}
                                </button>

                            </div>

                        </div>

                    )}


                    {/* ACTIONS */}

                    <div
                        className="
                            mt-6
                            flex
                            items-center
                            justify-end
                            gap-2
                        "
                    >

                        <button
                            type="button"
                            onClick={
                                handleClose
                            }
                            disabled={
                                actionLoading
                            }
                            className="
                                rounded-xl
                                border
                                border-white/[0.07]
                                bg-white/[0.03]
                                px-4
                                py-2.5
                                text-xs
                                font-semibold
                                text-slate-400
                                transition
                                hover:bg-white/[0.06]
                                hover:text-white
                                disabled:opacity-40
                            "
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={
                                actionLoading
                            }
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-purple-600
                                px-5
                                py-2.5
                                text-xs
                                font-bold
                                text-white
                                transition
                                hover:bg-purple-500
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            <Save
                                size={14}
                            />

                            {actionLoading
                                ? "Updating..."
                                : "Update User"
                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}


// ======================================================
// FIELD
// ======================================================

function Field({
    label,
    icon,
    children,
}) {

    return (

        <div>

            <label
                className="
                    mb-2
                    flex
                    items-center
                    gap-1.5
                    text-[11px]
                    font-semibold
                    text-slate-500
                "
            >

                {icon}

                {label}

            </label>


            {children}

        </div>

    );

}