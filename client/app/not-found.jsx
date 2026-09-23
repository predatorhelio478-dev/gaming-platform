"use client";

import {
    ArrowLeft,
    Gamepad2,
    Home,
    Search,
    Sparkles,
} from "lucide-react";

import {
    usePathname,
    useRouter,
} from "next/navigation";


// ======================================================
// 404 NOT FOUND PAGE
// ======================================================
//
// Shared by both the admin section and the regular user
// section - there is no "/dashboard" route in either (the
// admin home is "/admin/dashboard", the user home is
// "/games/color-prediction", see app/page.tsx). Which one
// "home" means depends on which section the visitor was in.
// ======================================================

export default function NotFound() {

    const router = useRouter();

    const pathname = usePathname();

    const homePath =
        pathname?.startsWith("/admin")
            ? "/admin/dashboard"
            : "/games/color-prediction";


    // ==================================================
    // GO BACK
    // ==================================================

    const handleGoBack = () => {

        if (
            typeof window !== "undefined" &&
            window.history.length > 1
        ) {

            router.back();

            return;

        }


        router.push(homePath);

    };


    // ==================================================
    // HOME
    // ==================================================

    const handleHome = () => {

        router.push(homePath);

    };


    return (

        <main
            className="
                relative
                flex
                min-h-screen
                items-center
                justify-center
                overflow-hidden
                bg-[#050712]
                px-4
                py-12
                text-white
            "
        >

            {/* ==================================================
                BACKGROUND GLOW
            ================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[500px]
                    w-[500px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-violet-600/[0.08]
                    blur-[120px]
                "
            />


            <div
                className="
                    pointer-events-none
                    absolute
                    left-[10%]
                    top-[15%]
                    h-40
                    w-40
                    rounded-full
                    bg-fuchsia-500/[0.06]
                    blur-[90px]
                "
            />


            <div
                className="
                    pointer-events-none
                    absolute
                    bottom-[10%]
                    right-[10%]
                    h-48
                    w-48
                    rounded-full
                    bg-indigo-500/[0.06]
                    blur-[100px]
                "
            />


            {/* ==================================================
                DECORATIVE GRID
            ================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.025]
                    [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)]
                    [background-size:50px_50px]
                "
            />


            {/* ==================================================
                CONTENT
            ================================================== */}

            <section
                className="
                    relative
                    z-10
                    w-full
                    max-w-xl
                    text-center
                "
            >

                {/* ==================================================
                    GAME ICON
                ================================================== */}


                {/* ==================================================
                    BRAND
                ================================================== */}

                <div
                    className="
                        mb-10
                        flex
                        items-center
                        justify-center
                        gap-4
                    "
                >

                    <div
                        className="
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-lg
                            bg-gradient-to-br
                            from-violet-500
                            to-fuchsia-500
                        "
                    >

                        <Gamepad2
                            size={35}
                        />

                    </div>


                    <div className="text-left">

                        <p
                            className="
                                text-[18px]
                                font-black
                                tracking-tight
                                text-white
                            "
                        >
                            GAMEZ
                        </p>


                        <p
                            className="
                                text-[10px]
                                uppercase
                                tracking-[0.22em]
                                text-violet-300/60
                            "
                        >
                            Gaming Platform
                        </p>

                    </div>

                </div>


                {/* ==================================================
                    404
                ================================================== */}

                <div
                    className="
                        relative
                        mx-auto
                        inline-block
                    "
                >

                    <h1
                        className="
                            bg-gradient-to-r
                            from-violet-300
                            via-fuchsia-300
                            to-violet-400
                            bg-clip-text
                            text-[100px]
                            font-black
                            leading-none
                            text-transparent
                            sm:text-[140px]
                        "
                    >
                        404
                    </h1>


                    <Sparkles
                        size={20}
                        className="
                            absolute
                            -right-5
                            top-2
                            text-violet-400
                        "
                    />

                </div>


                {/* ==================================================
                    TITLE
                ================================================== */}

                <h2
                    className="
                        mt-5
                        text-2xl
                        font-black
                        tracking-tight
                        text-white
                        sm:text-3xl
                    "
                >
                    Page Not Found
                </h2>


                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <p
                    className="
                        mx-auto
                        mt-3
                        max-w-md
                        text-sm
                        leading-6
                        text-slate-500
                        sm:text-base
                    "
                >
                    Looks like you took a wrong turn.
                    The page you're looking for doesn't
                    exist or may have been moved.
                </p>


                {/* ==================================================
                    STATUS CARD
                ================================================== */}

                <div
                    className="
                        mx-auto
                        mt-7
                        flex
                        max-w-sm
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        border-white/[0.06]
                        bg-white/[0.025]
                        px-4
                        py-3
                        text-left
                    "
                >

                    <div
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-red-500/[0.08]
                        "
                    >

                        <Search
                            size={16}
                            className="text-red-400"
                        />

                    </div>


                    <div className="min-w-0">

                        <p
                            className="
                                text-sm
                                font-semibold
                                text-slate-300
                            "
                        >
                            Page unavailable
                        </p>


                        <p
                            className="
                                mt-0.5
                                truncate
                                text-[12px]
                                text-slate-500   
                            "
                        >
                            The requested destination could not be found.
                        </p>

                    </div>

                </div>


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div
                    className="
                        mt-7
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-3
                        sm:flex-row
                    "
                >

                    {/* GO HOME */}

                    <button
                        type="button"
                        onClick={
                            handleHome
                        }
                        className="
                            inline-flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-gradient-to-r
                            from-violet-600
                            to-fuchsia-500
                            px-5
                            text-sm
                            font-bold
                            text-white
                            shadow-[0_0_25px_rgba(168,85,247,0.18)]
                            transition
                            hover:brightness-110
                            active:scale-[0.98]
                            sm:w-auto
                            cursor-pointer
                        "
                    >

                        <Home
                            size={16}
                        />

                        Back to Dashboard

                    </button>


                    {/* GO BACK */}

                    <button
                        type="button"
                        onClick={
                            handleGoBack
                        }
                        className="
                            inline-flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-white/[0.08]
                            bg-white/[0.025]
                            px-5
                            text-sm
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                            active:scale-[0.98]
                            sm:w-auto
                            cursor-pointer
                        "
                    >

                        <ArrowLeft
                            size={16}
                        />

                        Go Back

                    </button>

                </div>


                {/* ==================================================
                    FOOTNOTE
                ================================================== */}

                <p
                    className="
                        mt-5
                        text-[12px]
                        text-slate-500
                    "
                >
                    Error code: 404 · Page not found
                </p>

            </section>

        </main>

    );

}