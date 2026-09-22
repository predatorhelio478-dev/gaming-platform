"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentAdmin } from "../../lib/adminApi";

export default function AdminAuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // LOGIN AUR FORGOT-PASSWORD PAGE KO AUTH GUARD SE
        // BYPASS KARO - dono pre-auth (no session) routes hain
        if (
            pathname === "/admin/login" ||
            pathname === "/admin/forgot-password"
        ) {
            setChecking(false);
            setAuthorized(true);
            return;
        }

        let mounted = true;

        const checkAdmin = async () => {
            try {
                const token =
                    localStorage.getItem("adminToken");

                if (!token) {
                    router.replace("/admin/login");
                    return;
                }

                const response =
                    await getCurrentAdmin();

                if (
                    !response?.success ||
                    !response?.admin
                ) {
                    localStorage.removeItem(
                        "adminToken"
                    );

                    localStorage.removeItem(
                        "admin"
                    );

                    router.replace("/admin/login");
                    return;
                }

                if (mounted) {
                    setAuthorized(true);
                    setChecking(false);
                }
            } catch (error) {
                console.error(
                    "Admin Auth Check Error:",
                    error
                );

                localStorage.removeItem(
                    "adminToken"
                );

                localStorage.removeItem(
                    "admin"
                );

                router.replace("/admin/login");
            }
        };

        checkAdmin();

        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    if (checking) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#070914] text-white">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />

                    <p className="mt-4 text-sm text-slate-500">
                        Checking administrator access...
                    </p>
                </div>
            </main>
        );
    }

    if (!authorized) {
        return null;
    }

    return children;
}