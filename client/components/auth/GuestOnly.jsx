"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";


export default function GuestOnly({
    children,
    defaultRedirect = "/games/color-prediction",
}) {

    const router =
        useRouter();

    const pathname =
        usePathname();

    const searchParams =
        useSearchParams();


    const [checking, setChecking] =
        useState(true);


    useEffect(() => {

        /*
         * Get saved authentication.
         */

        const token =
            localStorage.getItem(
                "token"
            );


        /*
         * User is NOT logged in.
         *
         * Allow login/register page.
         */

        if (!token) {

            setChecking(false);

            return;

        }


        /*
         * User is already logged in.
         *
         * Get intended redirect.
         */

        const redirect =
            searchParams.get(
                "redirect"
            );


        /*
         * Only allow internal
         * application paths.
         */

        const redirectPath =
            redirect &&
                redirect.startsWith("/") &&
                !redirect.startsWith("//")
                ? redirect
                : defaultRedirect;


        /*
         * Do not allow login/register
         * to redirect back to themselves.
         */

        if (
            redirectPath === "/login" ||
            redirectPath === "/register"
        ) {

            router.replace(
                defaultRedirect
            );

            return;

        }


        /*
         * Redirect authenticated user.
         */

        router.replace(
            redirectPath
        );

    }, [
        router,
        searchParams,
        defaultRedirect,
    ]);


    /*
     * While checking auth,
     * don't show login/register form.
     */

    if (checking) {

        return (

            <main className="flex min-h-screen items-center justify-center bg-slate-950">

                <div className="text-sm text-slate-500">
                    Checking session...
                </div>

            </main>

        );

    }


    /*
     * If token exists, redirect is
     * already being performed.
     */

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem(
                "token"
            )
            : null;


    if (token) {

        return null;

    }


    /*
     * No token → render guest page.
     */

    return children;

}