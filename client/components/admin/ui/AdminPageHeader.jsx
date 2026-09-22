"use client";

// ======================================================
// ADMIN PAGE HEADER
// ======================================================
//
// Mirrors the Admin Rounds page's "PAGE TITLE + ACTIONS" card
// exactly (rounded-2xl border bg-[#070914] card; small icon +
// uppercase tracked eyebrow row; large bold title; description
// below; optional right-aligned actions) - Rounds itself keeps
// its own inline markup untouched; this is a shared component
// for every OTHER Admin page to reuse the same pattern instead
// of each hand-rolling (or omitting) it.

export default function AdminPageHeader({
    icon: Icon,
    eyebrow,
    title,
    description,
    actions,
}) {

    return (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div>

                    {eyebrow && (

                        <div className="flex items-center gap-2">

                            {Icon && <Icon size={17} className="text-purple-400" />}

                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                                {eyebrow}
                            </p>

                        </div>

                    )}

                    <h2 className="mt-2 text-2xl font-black text-white">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-2 text-sm text-slate-500">
                            {description}
                        </p>
                    )}

                </div>


                {actions && (

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {actions}
                    </div>

                )}

            </div>

        </div>
    );
}
