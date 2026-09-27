"use client";

import {
    Eye,
    Ban,
    CheckCircle2,
    Wallet,
    ShieldCheck,
    ShieldAlert,
    Users,
    Pencil,
    UserX,
    Trash2,
} from "lucide-react";

import AdminTable, {
    AdminTableRow,
    AdminTableCell,
} from "../ui/AdminTable";

import AdminBadge from "../ui/AdminBadge";
import AdminCheckbox from "../ui/AdminCheckbox";
import AdminPagination from "../ui/AdminPagination";
import AdminActionsMenu from "../ui/AdminActionsMenu";


// ======================================================
// USER TABLE
// ======================================================

export default function UserTable({
    users = [],
    pagination = {},
    refreshing = false,
    formatCurrency,
    formatDate,
    onView,
    onEdit,
    onBalance,
    onBlock,
    onUnblock,
    onDeactivate,
    onDelete,
    actionLoading = false,
    onPageChange,
    canManuallyVerify = false,
    onRequestVerification,
    // { email, mobile } - which verifications Settings -> User
    // currently requires (same rule as the withdrawal gate).
    verificationRequired = { email: false, mobile: false },
    currentAdminEmail = null,
    bulkEnabled = false,
    selectedIds = [],
    onSelectionChange,
    onBulkDelete,
}) {

    const page =
        Number(
            pagination?.page || 1
        );

    const totalPages =
        Number(
            pagination?.totalPages || 1
        );

    const total =
        Number(
            pagination?.total || 0
        );

    const limit =
        Number(
            pagination?.limit || 20
        );


    // ==================================================
    // EMPTY STATE
    // ==================================================

    const isEmpty =
        !Array.isArray(users) ||
        users.length === 0;


    const isOwnAccount =
        (user) =>
            Boolean(currentAdminEmail) &&
            String(user?.email || "").toLowerCase() ===
            String(currentAdminEmail).toLowerCase();


    // ==================================================
    // BULK SELECTION (checkbox column + Delete Selected)
    // ==================================================
    //
    // Only rows the viewer could delete one-by-one are
    // selectable - never their own account. The server
    // re-validates every id with the single-delete rules.

    const isSelectable =
        (user) => bulkEnabled && user?.role !== "admin" && !isOwnAccount(user) && !user?.isPermanentlyDeleted;

    const selectableIds =
        users
            .filter(isSelectable)
            .map((user) => String(user?._id));

    const selectedSet =
        new Set(selectedIds.map(String));

    const selectedCount =
        selectableIds.filter((id) => selectedSet.has(id)).length;

    const allSelected =
        selectableIds.length > 0 &&
        selectedCount === selectableIds.length;

    const toggleOne =
        (id, checked) => {
            const next = new Set(selectedSet);
            if (checked) next.add(id); else next.delete(id);
            onSelectionChange?.([...next]);
        };

    const toggleAll =
        (checked) => {
            onSelectionChange?.(checked ? selectableIds : []);
        };

    // ==================================================
    // HEADERS
    // ==================================================

    const headers = [

        {
            key: "user",
            label: "User",
        },

        {
            key: "contact",
            label: "Contact",
        },

        {
            key: "wallet",
            label: "Wallet",
        },

        {
            key: "verification",
            label: "Verification",
        },

        {
            key: "role",
            label: "Role",
        },

        {
            key: "status",
            label: "Status",
        },

        {
            key: "joined",
            label: "Joined",
        },

        {
            key: "action",
            label: "Action",
        },

    ];

    // Checkbox column first when bulk delete is available.
    const tableHeaders =
        bulkEnabled
            ? [
                {
                    key: "select",
                    label: (
                        <AdminCheckbox
                            ariaLabel="Select all"
                            checked={allSelected}
                            indeterminate={selectedCount > 0}
                            disabled={selectableIds.length === 0}
                            onChange={toggleAll}
                        />
                    ),
                },
                ...headers,
            ]
            : headers;


    // ==================================================
    // SAFE DATE
    // ==================================================

    const getDate =
        (value) => {

            if (
                typeof formatDate ===
                "function"
            ) {

                return formatDate(
                    value
                );

            }


            if (!value) {
                return "—";
            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "—";

            }


            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            ).format(
                date
            );

        };


    // ==================================================
    // SAFE CURRENCY
    // ==================================================

    const getCurrency =
        (value) => {

            if (
                typeof formatCurrency ===
                "function"
            ) {

                return formatCurrency(
                    value
                );

            }


            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                }
            ).format(
                Number(
                    value || 0
                )
            );

        };


    // ==================================================
    // USER HELPERS
    // ==================================================

    const getUserName =
        (user) =>
            user?.fullName ||
            user?.name ||
            user?.username ||
            "Unknown User";


    const getUsername =
        (user) =>
            user?.username
                ? `@${user.username}`
                : "";


    const getWalletBalance =
        (user) =>
            user?.wallet?.balance ??
            user?.walletBalance ??
            user?.balance ??
            0;


    const getMobile =
        (user) =>
            user?.mobile ||
            user?.phone ||
            "No mobile";


    const getInitials =
        (user) => {

            const name =
                getUserName(
                    user
                );


            const parts =
                name
                    .trim()
                    .split(
                        /\s+/
                    )
                    .filter(Boolean);


            if (
                parts.length >= 2
            ) {

                return (
                    parts[0][0] +
                    parts[1][0]
                ).toUpperCase();

            }


            return (
                name
                    .slice(
                        0,
                        2
                    )
                    .toUpperCase()
            );

        };


    // ==================================================
    // USER ROLE
    // ==================================================

    const getRoleVariant =
        (user) =>
            user?.role === "admin"
                ? "purple"
                : "default";


    const getRoleLabel =
        (user) =>
            user?.role === "admin"
                ? "Admin"
                : "Player";


    // ==================================================
    // STATUS
    // ==================================================

    const isBlocked =
        (user) =>
            user?.status ===
            "blocked";


    // ==================================================
    // VERIFICATION
    // ==================================================

    // Per channel: a REQUIRED channel shows its real status as
    // Verified / Unverified (amber when missing). A channel that
    // isn't required is never shown as a missing requirement -
    // verified still shows as verified, otherwise a neutral
    // "optional".
    const getChannelBadge =
        (verified, required) => {

            if (verified) {

                return { variant: "success", text: "Verified", Icon: ShieldCheck };

            }

            return required
                ? { variant: "warning", text: "Unverified", Icon: ShieldAlert }
                : { variant: "default", text: "Optional", Icon: null };

        };


    return (

        <AdminTable
            title="Player Accounts"
            subtitle={
                `${total.toLocaleString("en-IN")} total accounts`
            }
            count={
                users.length
            }

            icon={
                <Users
                    size={18}
                />
            }

            headers={
                tableHeaders
            }
            headerAction={
                selectedCount > 0 && (
                    <button
                        type="button"
                        onClick={onBulkDelete}
                        disabled={actionLoading}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Trash2 size={13} />
                        Delete Selected ({selectedCount})
                    </button>
                )
            }
            empty={
                isEmpty
            }
            emptyTitle="No users found"
            emptyMessage={
                "No player accounts match your current filters."
            }
            minWidth="1260px"
        >

            {/* =================================================
                USER ROWS
            ================================================== */}

            {users.map(
                (user) => {

                    const userBlocked =
                        isBlocked(
                            user
                        );


                    const channelBadges = [
                        {
                            key: "email",
                            label: "Email",
                            ...getChannelBadge(Boolean(user?.emailVerified), verificationRequired.email),
                        },
                        {
                            key: "mobile",
                            label: "Mobile",
                            ...getChannelBadge(Boolean(user?.mobileVerified), verificationRequired.mobile),
                        },
                    ];


                    const admin =
                        user?.role ===
                        "admin";


                    // The logged-in admin's own player account
                    // (same email) - editable, never deletable.
                    // Also refused server-side.
                    const isSelf =
                        Boolean(currentAdminEmail) &&
                        String(user?.email || "").toLowerCase() ===
                        String(currentAdminEmail).toLowerCase();


                    return (

                        <AdminTableRow
                            key={
                                user?._id ||
                                user?.id ||
                                user?.username
                            }
                            className={
                                selectedSet.has(String(user?._id))
                                    ? "bg-purple-500/[0.04]"
                                    : ""
                            }
                        >

                            {bulkEnabled && (

                                <AdminTableCell className="w-10">

                                    <AdminCheckbox
                                        ariaLabel="Select row"
                                        checked={selectedSet.has(String(user?._id))}
                                        disabled={!isSelectable(user)}
                                        title={
                                            isSelf
                                                ? "You cannot delete your own account"
                                                : !isSelectable(user)
                                                    ? "You cannot delete this account"
                                                    : "Select"
                                        }
                                        onChange={(checked) => toggleOne(String(user?._id), checked)}
                                    />

                                </AdminTableCell>

                            )}

                            {/* =================================================
                                USER
                            ================================================== */}

                            <AdminTableCell
                                className="
                                    min-w-[220px]
                                "
                            >

                                <div
                                    className="
                                        flex
                                        min-w-0
                                        items-center
                                        gap-3
                                    "
                                >

                                    {/* AVATAR */}

                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            border-purple-500/20
                                            bg-purple-500/[0.06]
                                            text-xs
                                            font-black
                                            text-purple-300
                                        "
                                    >
                                        {
                                            getInitials(
                                                user
                                            )
                                        }
                                    </div>


                                    {/* NAME */}

                                    <div
                                        className="
                                            min-w-0
                                        "
                                    >

                                        <p
                                            className="
                                                truncate
                                                text-xs
                                                font-bold
                                                text-white
                                            "
                                        >
                                            {
                                                getUserName(
                                                    user
                                                )
                                            }
                                        </p>


                                        <p
                                            className="
                                                mt-0.5
                                                truncate
                                                text-[10px]
                                                text-slate-600
                                            "
                                        >
                                            {
                                                getUsername(
                                                    user
                                                )
                                            }
                                        </p>

                                    </div>

                                </div>

                            </AdminTableCell>


                            {/* =================================================
                                CONTACT
                            ================================================== */}

                            <AdminTableCell>

                                <div
                                    className="
                                        min-w-[170px]
                                    "
                                >

                                    <p
                                        className="
                                            truncate
                                            text-xs
                                            font-medium
                                            text-slate-400
                                        "
                                    >
                                        {
                                            user?.email ||
                                            "No email"
                                        }
                                    </p>


                                    <p
                                        className="
                                            mt-1
                                            text-[10px]
                                            text-slate-500
                                        "
                                    >
                                        {
                                            getMobile(
                                                user
                                            )
                                        }
                                    </p>

                                </div>

                            </AdminTableCell>


                            {/* =================================================
                                WALLET
                            ================================================== */}

                            <AdminTableCell>

                                <div
                                    className="
                                        flex
                                        min-w-[100px]
                                        items-center
                                        gap-1.5
                                    "
                                >

                                    <Wallet
                                        size={14}
                                        className="
                                            shrink-0
                                            text-yellow-400
                                        "
                                    />


                                    <span
                                        className="
                                            whitespace-nowrap
                                            text-xs
                                            font-bold
                                            text-white
                                        "
                                    >
                                        {
                                            getCurrency(
                                                getWalletBalance(
                                                    user
                                                )
                                            )
                                        }
                                    </span>

                                </div>

                            </AdminTableCell>


                            {/* =================================================
                                VERIFICATION
                            ================================================== */}

                            <AdminTableCell>

                                <div className="flex flex-col items-start gap-1">

                                    {channelBadges.map(({ key, label, variant, text, Icon }) => (

                                        <AdminBadge
                                            key={key}
                                            variant={variant}
                                        >

                                            {Icon && (
                                                <Icon
                                                    size={11}
                                                    className="mr-1"
                                                />
                                            )}

                                            {label} · {text}

                                        </AdminBadge>

                                    ))}

                                </div>

                            </AdminTableCell>


                            {/* =================================================
                                ROLE
                            ================================================== */}

                            <AdminTableCell>

                                <AdminBadge
                                    variant={
                                        getRoleVariant(
                                            user
                                        )
                                    }
                                >
                                    {
                                        getRoleLabel(
                                            user
                                        )
                                    }
                                </AdminBadge>

                            </AdminTableCell>


                            {/* =================================================
                                STATUS
                            ================================================== */}

                            <AdminTableCell>

                                {user?.isPermanentlyDeleted ? (

                                    <AdminBadge
                                        variant="danger"
                                    >

                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />

                                        Deleted

                                    </AdminBadge>

                                ) : userBlocked ? (

                                    <AdminBadge
                                        variant="danger"
                                    >

                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />

                                        Blocked

                                    </AdminBadge>

                                ) : (

                                    <AdminBadge
                                        variant="success"
                                    >

                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />

                                        Active

                                    </AdminBadge>

                                )}

                            </AdminTableCell>


                            {/* =================================================
                                JOINED
                            ================================================== */}

                            <AdminTableCell>

                                <span
                                    className="
                                        whitespace-nowrap
                                        text-xs
                                        font-medium
                                        text-slate-500
                                    "
                                >
                                    {
                                        getDate(
                                            user?.createdAt
                                        )
                                    }
                                </span>

                            </AdminTableCell>


                            {/* =================================================
                                ACTION
                            ================================================== */}

                            <AdminTableCell
                                className="
                                    text-right
                                "
                            >

                                <div
                                    className="
                                        flex
                                        min-w-[230px]
                                        items-center
                                        gap-2
                                    "
                                >

                                    {/* =================================================
                                        EDIT
                                    ================================================== */}

                                    <button
                                        type="button"
                                        disabled={
                                            actionLoading
                                        }
                                        onClick={() =>
                                            onEdit?.(
                                                user
                                            )
                                        }
                                        title="Edit user"
                                        className="
                                            inline-flex
                                            cursor-pointer
                                            items-center
                                            justify-center
                                            rounded-lg
                                            border
                                            border-purple-500/20
                                            bg-purple-500/[0.05]
                                            p-2
                                            text-purple-400
                                            transition
                                            hover:bg-purple-500/[0.10]
                                            hover:text-purple-300
                                            disabled:cursor-not-allowed
                                            disabled:opacity-40
                                        "
                                    >

                                        <Pencil
                                            size={14}
                                        />

                                    </button>


                                    {/* =================================================
                                        VIEW
                                    ================================================== */}

                                    <button
                                        type="button"
                                        disabled={
                                            actionLoading
                                        }
                                        onClick={() =>
                                            onView?.(
                                                user
                                            )
                                        }
                                        title="View user"
                                        className="
                                            inline-flex
                                            cursor-pointer
                                            items-center
                                            gap-1.5
                                            rounded-lg
                                            border
                                            border-white/[0.06]
                                            bg-white/[0.025]
                                            px-3
                                            py-2
                                            text-xs
                                            font-semibold
                                            text-slate-400
                                            transition
                                            hover:bg-white/[0.06]
                                            hover:text-white
                                            disabled:cursor-not-allowed
                                            disabled:opacity-40
                                        "
                                    >

                                        <Eye
                                            size={13}
                                        />

                                        View

                                    </button>


                                    {/* =================================================
                                        BALANCE
                                    ================================================== */}

                                    {!admin && (

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() =>
                                                onBalance?.(
                                                    user
                                                )
                                            }
                                            title="Adjust wallet balance"
                                            className="
                                                inline-flex
                                                cursor-pointer
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-yellow-500/20
                                                bg-yellow-500/[0.05]
                                                p-2
                                                text-yellow-400
                                                transition
                                                hover:bg-yellow-500/[0.10]
                                                hover:text-yellow-300
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >

                                            <Wallet
                                                size={14}
                                            />

                                        </button>

                                    )}


                                    {/* =================================================
                                        DELETE (PERMANENT)
                                    ================================================== */}

                                    {!admin && !isSelf && !user?.isPermanentlyDeleted && (

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() =>
                                                onDelete?.(
                                                    user
                                                )
                                            }
                                            title="Permanently delete user"
                                            className="
                                                inline-flex
                                                cursor-pointer
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-red-600/30
                                                bg-red-600/[0.08]
                                                p-2
                                                text-red-500
                                                transition
                                                hover:bg-red-600/[0.15]
                                                hover:text-red-400
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >

                                            <Trash2
                                                size={14}
                                            />

                                        </button>

                                    )}


                                    {/* =================================================
                                        MORE ACTIONS (Block/Unblock, Deactivate,
                                        Verify/Unverify Email/Mobile)
                                    ================================================== */}

                                    <AdminActionsMenu
                                        disabled={actionLoading}
                                        items={[

                                            !admin && (
                                                userBlocked
                                                    ? {
                                                        key: "unblock",
                                                        label: "Unblock User",
                                                        icon: CheckCircle2,
                                                        onClick: () => onUnblock?.(user),
                                                    }
                                                    : {
                                                        key: "block",
                                                        label: "Block User",
                                                        icon: Ban,
                                                        danger: true,
                                                        onClick: () => onBlock?.(user),
                                                    }
                                            ),

                                            !admin && !isSelf && !user?.isDeleted && !user?.isPermanentlyDeleted && {
                                                key: "deactivate",
                                                label: "Deactivate User",
                                                icon: UserX,
                                                danger: true,
                                                onClick: () => onDeactivate?.(user),
                                            },

                                            canManuallyVerify && (
                                                user?.emailVerified
                                                    ? {
                                                        key: "unverify-email",
                                                        label: "Unverify Email",
                                                        icon: ShieldAlert,
                                                        onClick: () => onRequestVerification?.(user, "email", false),
                                                    }
                                                    : {
                                                        key: "verify-email",
                                                        label: "Verify Email",
                                                        icon: ShieldCheck,
                                                        onClick: () => onRequestVerification?.(user, "email", true),
                                                    }
                                            ),

                                            canManuallyVerify && user?.mobile && (
                                                user?.mobileVerified
                                                    ? {
                                                        key: "unverify-mobile",
                                                        label: "Unverify Mobile",
                                                        icon: ShieldAlert,
                                                        onClick: () => onRequestVerification?.(user, "mobile", false),
                                                    }
                                                    : {
                                                        key: "verify-mobile",
                                                        label: "Verify Mobile",
                                                        icon: ShieldCheck,
                                                        onClick: () => onRequestVerification?.(user, "mobile", true),
                                                    }
                                            ),

                                        ]}
                                    />

                                </div>

                            </AdminTableCell>

                        </AdminTableRow>

                    );

                }
            )}


            {/* =================================================
                PAGINATION
            ================================================== */}

            {!isEmpty && (

                <tr>

                    <td
                        colSpan={
                            headers.length
                        }
                        className="p-0"
                    >

                        <AdminPagination
                            page={
                                page
                            }
                            totalPages={
                                totalPages
                            }
                            total={
                                total
                            }
                            limit={
                                limit
                            }
                            loading={
                                refreshing ||
                                actionLoading
                            }
                            itemLabel="users"
                            onPageChange={
                                onPageChange
                            }
                        />

                    </td>

                </tr>

            )}

        </AdminTable>

    );

}