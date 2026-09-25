"use client";

import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    Eye,
    EyeOff,
    LogIn,
} from "lucide-react";

import {
    adminLogin,
    saveAdminSession,
    getCurrentAdmin,
} from "../../../lib/adminApi";

import AuthShell, {
    SecurityNote,
} from "../../../components/auth/AuthShell";

import RateLimitCountdown
    from "../../../components/auth/RateLimitCountdown";

import useRateLimitCountdown
    from "../../../lib/useRateLimitCountdown";


/*
 * useSearchParams() requires a Suspense boundary during
 * static prerendering (Next.js App Router) - the real form
 * lives in AdminLoginForm below, wrapped by the default
 * export.
 */
export default function AdminLoginPage() {

    return (

        <Suspense
            fallback={
                <main className="relative min-h-screen overflow-hidden bg-[#070914] text-white">

                    <div className="relative flex min-h-screen items-center justify-center px-4">

                        <div className="text-center">

                            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />

                            <p className="text-sm text-slate-500">
                                Loading...
                            </p>

                        </div>

                    </div>

                </main>
            }
        >

            <AdminLoginForm />

        </Suspense>

    );

}


function AdminLoginForm() {

    const router =
        useRouter();

    const searchParams =
        useSearchParams();


    const [formData, setFormData] =
        useState({
            username: "",
            password: "",
        });


    const [loading, setLoading] =
        useState(false);


    const [checkingSession, setCheckingSession] =
        useState(true);


    const [error, setError] =
        useState("");


    const [showPassword, setShowPassword] =
        useState(false);


    const adminLoginLimiter =
        useRateLimitCountdown("admin_login_rate_limit");


    // ======================================================
    // GET SAFE REDIRECT PATH
    // ======================================================

    const getRedirectPath = () => {

        const redirect =
            searchParams.get(
                "redirect"
            );


        /*
         * Only allow internal admin
         * routes.
         */

        if (
            redirect &&
            redirect.startsWith("/admin/") &&
            !redirect.startsWith("//") &&
            redirect !== "/admin/login"
        ) {

            return redirect;

        }


        return "/admin/dashboard";

    };


    // ======================================================
    // CHECK EXISTING ADMIN SESSION
    // ======================================================

    useEffect(() => {

        let cancelled = false;


        const checkSession =
            async () => {

                const token =
                    localStorage.getItem(
                        "adminToken"
                    );


                /*
                 * No token.
                 *
                 * Show login page.
                 */

                if (!token) {

                    if (!cancelled) {

                        setCheckingSession(
                            false
                        );

                    }

                    return;

                }


                /*
                 * Token exists.
                 *
                 * Verify it with backend.
                 */

                try {

                    const response =
                        await getCurrentAdmin();


                    if (
                        cancelled
                    ) {

                        return;

                    }


                    /*
                     * Backend returned valid admin.
                     *
                     * Do not show login page.
                     */

                    if (
                        response
                    ) {

                        router.replace(
                            getRedirectPath()
                        );

                        return;

                    }

                } catch (
                sessionError
                ) {

                    console.error(
                        "Admin Session Check Error:",
                        sessionError
                    );


                    /*
                     * adminRequest already clears
                     * invalid/expired admin session.
                     */

                }


                if (!cancelled) {

                    setCheckingSession(
                        false
                    );

                }

            };


        checkSession();


        return () => {

            cancelled = true;

        };

    }, [
        router,
        searchParams,
    ]);


    // ======================================================
    // HANDLE INPUT
    // ======================================================

    const handleChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;


            setFormData(
                (previous) => ({

                    ...previous,

                    [name]:
                        value,

                })
            );


            if (error) {

                setError("");

            }

        };


    // ======================================================
    // LOGIN
    // ======================================================

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            setError("");


            if (
                !formData.username.trim() ||
                !formData.password
            ) {

                setError(
                    "Username and password are required."
                );

                return;

            }


            try {

                setLoading(
                    true
                );


                const response =
                    await adminLogin(

                        formData.username.trim(),

                        formData.password

                    );


                console.log(
                    "Admin Login Response:",
                    response
                );


                if (
                    !response?.success
                ) {

                    throw new Error(
                        response?.message ||
                        "Admin login failed."
                    );

                }


                // ==================================================
                // SAVE ADMIN SESSION
                // ==================================================

                saveAdminSession(
                    response
                );


                // ==================================================
                // REDIRECT
                // ==================================================

                const redirectPath =
                    getRedirectPath();


                router.replace(
                    redirectPath
                );


            } catch (
            loginError
            ) {

                console.error(
                    "Admin Login Error:",
                    loginError
                );


                if (
                    loginError?.status === 429 &&
                    loginError?.data?.retryAfterSeconds
                ) {

                    adminLoginLimiter.start(
                        loginError.data.retryAfterSeconds
                    );

                    return;

                }


                setError(
                    loginError?.message ||
                    "Unable to login."
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    // ======================================================
    // SESSION CHECK LOADING
    // ======================================================

    if (
        checkingSession
    ) {

        return (

            <main className="relative min-h-screen overflow-hidden bg-[#070914] text-white">

                <div className="pointer-events-none absolute inset-0">

                    <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />

                    <div className="absolute bottom-[-200px] right-[-100px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-3xl" />

                </div>


                <div className="relative flex min-h-screen items-center justify-center px-4">

                    <div className="text-center">

                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />

                        <p className="text-sm text-slate-500">
                            Checking administrator session...
                        </p>

                    </div>

                </div>

            </main>

        );

    }


    // ======================================================
    // LOGIN PAGE
    // ======================================================

    return (

        <AuthShell
            heading="Admin Panel"
            subheading="Secure administrator access"
            cardIcon={<LogIn size={17} className="text-purple-400" />}
            cardTitle="Sign in"
            cardDescription="Enter your administrator credentials."
            error={
                adminLoginLimiter.active
                    ? <RateLimitCountdown formatted={adminLoginLimiter.formatted} />
                    : error
            }
            bottomTextSuffix="Administration"
            footer={
                <p className="text-xs text-slate-600">
                    Authorized administrators only
                </p>
            }
        >

            <form
                onSubmit={
                    handleSubmit
                }
                className="space-y-5"
            >


                {/* USERNAME */}

                <div>

                    <label
                        htmlFor="username"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Username or Email
                    </label>


                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={
                            formData.username
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter username or email"
                        autoComplete="username"
                        disabled={
                            loading
                        }
                        className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                </div>


                {/* PASSWORD */}

                <div>

                    <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Password
                    </label>


                    <div className="relative">

                        <input
                            id="password"
                            name="password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                            disabled={
                                loading
                            }
                            className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />


                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    (previous) =>
                                        !previous
                                )
                            }
                            disabled={
                                loading
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >

                            {showPassword ? (

                                <EyeOff
                                    size={15}
                                />

                            ) : (

                                <Eye
                                    size={15}
                                />

                            )}

                            {showPassword
                                ? "Hide"
                                : "Show"
                            }

                        </button>

                    </div>

                </div>


                <div className="-mt-2 text-right">
                    <a
                        href="/admin/forgot-password"
                        className="text-xs font-semibold text-purple-400 transition hover:text-purple-300 hover:underline"
                    >
                        Forgot password?
                    </a>
                </div>


                <SecurityNote text="Secure administrator connection" />


                {/* LOGIN */}

                <button
                    type="submit"
                    disabled={
                        loading ||
                        adminLoginLimiter.active
                    }
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    {adminLoginLimiter.active ? (

                        <span>Try again in {adminLoginLimiter.formatted}</span>

                    ) : loading ? (

                        <span className="flex items-center justify-center gap-2">

                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                            Signing in...

                        </span>

                    ) : (

                        <span className="flex items-center justify-center gap-2">

                            <LogIn
                                size={16}
                            />

                            Sign in to Admin Panel

                        </span>

                    )}

                </button>

            </form>

        </AuthShell>

    );

}
