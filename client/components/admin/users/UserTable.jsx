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
import AdminPagination from "../ui/AdminPagination";


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

    const isVerified =
        (user) =>
            Boolean(
                user?.emailVerified
            ) &&
            Boolean(
                user?.mobileVerified
            );


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
                headers
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


                    const verified =
                        isVerified(
                            user
                        );


                    const admin =
                        user?.role ===
                        "admin";


                    return (

                        <AdminTableRow
                            key={
                                user?._id ||
                                user?.id ||
                                user?.username
                            }
                        >

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
                                            text-slate-700
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

                                {verified ? (

                                    <AdminBadge
                                        variant="success"
                                    >

                                        <ShieldCheck
                                            size={11}
                                            className="mr-1"
                                        />

                                        Verified

                                    </AdminBadge>

                                ) : (

                                    <AdminBadge
                                        variant="warning"
                                    >

                                        <ShieldAlert
                                            size={11}
                                            className="mr-1"
                                        />

                                        Unverified

                                    </AdminBadge>

                                )}

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
                                        BLOCK / UNBLOCK
                                    ================================================== */}

                                    {!admin &&
                                        (
                                            userBlocked
                                                ? (

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() =>
                                                            onUnblock?.(
                                                                user
                                                            )
                                                        }
                                                        title="Unblock user"
                                                        className="
                                                            inline-flex
                                                            cursor-pointer
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-green-500/20
                                                            bg-green-500/[0.05]
                                                            p-2
                                                            text-green-400
                                                            transition
                                                            hover:bg-green-500/[0.10]
                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-40
                                                        "
                                                    >

                                                        <CheckCircle2
                                                            size={14}
                                                        />

                                                    </button>

                                                )
                                                : (

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() =>
                                                            onBlock?.(
                                                                user
                                                            )
                                                        }
                                                        title="Block user"
                                                        className="
                                                            inline-flex
                                                            cursor-pointer
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-red-500/20
                                                            bg-red-500/[0.05]
                                                            p-2
                                                            text-red-400
                                                            transition
                                                            hover:bg-red-500/[0.10]
                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-40
                                                        "
                                                    >

                                                        <Ban
                                                            size={14}
                                                        />

                                                    </button>

                                                )
                                        )}


                                    {/* =================================================
                                        DEACTIVATE (SOFT DELETE)
                                    ================================================== */}

                                    {!admin && !user?.isDeleted && !user?.isPermanentlyDeleted && (

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() =>
                                                onDeactivate?.(
                                                    user
                                                )
                                            }
                                            title="Deactivate user"
                                            className="
                                                inline-flex
                                                cursor-pointer
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-red-500/20
                                                bg-red-500/[0.05]
                                                p-2
                                                text-red-400
                                                transition
                                                hover:bg-red-500/[0.10]
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >

                                            <UserX
                                                size={14}
                                            />

                                        </button>

                                    )}


                                    {/* =================================================
                                        DELETE (PERMANENT)
                                    ================================================== */}

                                    {!admin && !user?.isPermanentlyDeleted && (

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