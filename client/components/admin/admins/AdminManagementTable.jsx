"use client";

import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Pencil,
    CheckCircle2,
    Ban,
    KeyRound,
    Trash2,
} from "lucide-react";

import AdminTable, {
    AdminTableRow,
    AdminTableCell,
} from "../ui/AdminTable";

import AdminBadge from "../ui/AdminBadge";
import AdminCheckbox from "../ui/AdminCheckbox";
import AdminPagination from "../ui/AdminPagination";


// ======================================================
// ADMIN MANAGEMENT TABLE
// ======================================================
//
// Deliberately mirrors UserTable.jsx's structure, headers,
// spacing and action-button styling exactly, so the two
// management screens read as one consistent product - only
// the columns/actions that don't apply to admin accounts
// (wallet balance, block/unblock, permanent delete) are
// swapped for their admin-account equivalents.

export default function AdminManagementTable({
    admins = [],
    pagination = {},
    refreshing = false,
    formatDate,
    currentAdminId,
    currentAdminRole,
    onEdit,
    onReactivate,
    onDeactivate,
    onDelete,
    bulkEnabled = false,
    selectedIds = [],
    onSelectionChange,
    onBulkDelete,
    onChangePassword,
    actionLoading = false,
    onPageChange,
}) {

    const isSuperAdminViewer = currentAdminRole === "super_admin";

    // ==================================================
    // BULK SELECTION (checkbox column + Delete Selected)
    // ==================================================
    //
    // Only rows the viewer could delete one-by-one are
    // selectable - never their own account. The server
    // re-validates every id with the single-delete rules.

    const isSelectable =
        (admin) => bulkEnabled && Boolean(currentAdminId) && String(admin?._id) !== String(currentAdminId) && (isSuperAdminViewer || admin?.role !== "super_admin");

    const selectableIds =
        admins
            .filter(isSelectable)
            .map((admin) => String(admin?._id));

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

    const page =
        Number(
            pagination?.page || 1
        );

    const totalPages =
        Number(
            pagination?.pages || pagination?.totalPages || 1
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
        !Array.isArray(admins) ||
        admins.length === 0;


    // ==================================================
    // HEADERS
    // ==================================================

    const headers = [

        {
            key: "admin",
            label: "Admin",
        },

        {
            key: "contact",
            label: "Contact",
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
            key: "created",
            label: "Created",
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
    // ADMIN HELPERS
    // ==================================================

    const getAdminName =
        (admin) =>
            admin?.fullName ||
            admin?.name ||
            admin?.username ||
            "Unknown Admin";


    const getUsername =
        (admin) =>
            admin?.username
                ? `@${admin.username}`
                : "";


    const getInitials =
        (admin) => {

            const name =
                getAdminName(
                    admin
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


    const ROLE_VARIANT = {
        super_admin: "purple",
        admin: "info",
        operator: "default",
    };

    const ROLE_LABEL = {
        super_admin: "Super Admin",
        admin: "Admin",
        operator: "Operator",
    };


    const isVerified =
        (admin) =>
            Boolean(
                admin?.emailVerified
            ) &&
            Boolean(
                admin?.phoneVerified
            );


    return (

        <AdminTable
            title="Admin Accounts"
            subtitle={
                `${total.toLocaleString("en-IN")} total accounts`
            }
            count={
                admins.length
            }

            icon={
                <ShieldCheck
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
            emptyTitle="No admins found"
            emptyMessage={
                "No admin accounts match your current filters."
            }
            minWidth="1160px"
        >

            {/* =================================================
                ADMIN ROWS
            ================================================== */}

            {admins.map(
                (admin) => {

                    const isSelf =
                        String(admin?._id) ===
                        String(currentAdminId);


                    const targetIsSuperAdmin =
                        admin?.role ===
                        "super_admin";


                    const canManage =
                        currentAdminRole === "super_admin" ||
                        !targetIsSuperAdmin;


                    const verified =
                        isVerified(
                            admin
                        );


                    const deactivated =
                        admin?.isActive === false;


                    return (

                        <AdminTableRow
                            key={
                                admin?._id ||
                                admin?.username
                            }
                            className={
                                selectedSet.has(String(admin?._id))
                                    ? "bg-purple-500/[0.04]"
                                    : ""
                            }
                        >

                            {bulkEnabled && (

                                <AdminTableCell className="w-10">

                                    <AdminCheckbox
                                        ariaLabel="Select row"
                                        checked={selectedSet.has(String(admin?._id))}
                                        disabled={!isSelectable(admin)}
                                        title={
                                            isSelf
                                                ? "You cannot delete your own account"
                                                : !isSelectable(admin)
                                                    ? "You cannot delete this account"
                                                    : "Select"
                                        }
                                        onChange={(checked) => toggleOne(String(admin?._id), checked)}
                                    />

                                </AdminTableCell>

                            )}

                            {/* =================================================
                                ADMIN
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
                                                admin
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
                                                getAdminName(
                                                    admin
                                                )
                                            }

                                            {isSelf && (
                                                <span className="ml-1.5 text-[10px] font-semibold text-slate-600">(you)</span>
                                            )}
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
                                                    admin
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
                                            admin?.email ||
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
                                            admin?.mobile ||
                                            "No mobile"
                                        }
                                    </p>

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
                                        ROLE_VARIANT[admin?.role] || "default"
                                    }
                                >
                                    {
                                        ROLE_LABEL[admin?.role] || admin?.role
                                    }
                                </AdminBadge>

                            </AdminTableCell>


                            {/* =================================================
                                STATUS
                            ================================================== */}

                            <AdminTableCell>

                                {deactivated ? (

                                    <AdminBadge
                                        variant="danger"
                                    >

                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />

                                        Deactivated

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
                                CREATED
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
                                            admin?.createdAt
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
                                        min-w-[170px]
                                        items-center
                                        justify-end
                                        gap-2
                                    "
                                >

                                    {/* =================================================
                                        EDIT
                                    ================================================== */}

                                    <button
                                        type="button"
                                        disabled={
                                            actionLoading ||
                                            !canManage
                                        }
                                        onClick={() =>
                                            onEdit?.(
                                                admin
                                            )
                                        }
                                        title={
                                            !canManage
                                                ? "Only a super admin can edit another super admin"
                                                : "Edit admin"
                                        }
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
                                        CHANGE PASSWORD (Super Admin viewer only)
                                    ================================================== */}

                                    {isSuperAdminViewer && (

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => onChangePassword?.(admin)}
                                            title="Change password"
                                            className="
                                                inline-flex
                                                cursor-pointer
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-blue-500/20
                                                bg-blue-500/[0.05]
                                                p-2
                                                text-blue-400
                                                transition
                                                hover:bg-blue-500/[0.10]
                                                hover:text-blue-300
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >

                                            <KeyRound
                                                size={14}
                                            />

                                        </button>

                                    )}


                                    {/* =================================================
                                        REACTIVATE / DEACTIVATE
                                    ================================================== */}

                                    {deactivated ? (

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading ||
                                                !canManage
                                            }
                                            onClick={() =>
                                                onReactivate?.(
                                                    admin
                                                )
                                            }
                                            title={
                                                !canManage
                                                    ? "Only a super admin can reactivate another super admin"
                                                    : "Reactivate admin"
                                            }
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

                                    ) : (

                                        // Never rendered at all for your own
                                        // currently logged-in account - not
                                        // just disabled. Self-deactivation is
                                        // also independently blocked server-
                                        // side (see adminManagementService),
                                        // so this is a UI convenience, not
                                        // the actual enforcement.
                                        // Also hidden until the logged-in
                                        // admin is known, so the own row
                                        // never flashes a Delete button.
                                        currentAdminId && !isSelf && (

                                            <button
                                                type="button"
                                                disabled={
                                                    actionLoading ||
                                                    !canManage
                                                }
                                                onClick={() =>
                                                    onDeactivate?.(
                                                        admin
                                                    )
                                                }
                                                title={
                                                    !canManage
                                                        ? "Only a super admin can deactivate another super admin"
                                                        : "Deactivate admin"
                                                }
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

                                                <ShieldX
                                                    size={14}
                                                />

                                            </button>

                                        )

                                    )}


                                    {/* =================================================
                                        DELETE (permanent) - every other
                                        account, never your own. Same
                                        hierarchy as Deactivate (disabled
                                        with an explanation where not
                                        permitted); enforced server-side.
                                    ================================================== */}

                                    {currentAdminId && !isSelf && (

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading ||
                                                !canManage
                                            }
                                            onClick={() =>
                                                onDelete?.(
                                                    admin
                                                )
                                            }
                                            title={
                                                !canManage
                                                    ? "Only a super admin can delete another super admin"
                                                    : "Delete admin"
                                            }
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
                                                hover:text-red-300
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
                            itemLabel="admins"
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
