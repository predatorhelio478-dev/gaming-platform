"use client";

import { usePathname } from "next/navigation";

import AdminAuthGuard from "../../components/admin/AdminAuthGuard";
import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    const isPublicAdminPage =
        pathname === "/admin/login" ||
        pathname === "/admin/forgot-password";

    if (isPublicAdminPage) {
        return children;
    }

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-[#070914] text-white">
                <AdminSidebar />

                <div className="lg:pl-64">
                    {children}
                </div>
            </div>
        </AdminAuthGuard>
    );
}