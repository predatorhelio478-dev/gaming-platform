"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    Search,
    ChevronDown,
    UserCircle,
    Wallet,
    CreditCard,
    Gamepad2,
    Gift,
    ShieldCheck,
    LifeBuoy,
    HelpCircle,
    X,
} from "lucide-react";

import UserLayout from "../user/UserLayout";
import UserPageHeader from "../user/UserPageHeader";
import { LoadingState, ErrorState, EmptyState } from "../user/PageState";
import { getFaq } from "../../lib/api";


// ======================================================
// ICON ALLOWLIST
// ======================================================
//
// `category.icon` is an admin-editable plain string - never
// rendered as HTML/code. Only a known, safe set of icon keys
// maps to an actual component; anything else (including a
// malicious/garbage value) falls back to a generic icon.

const ICON_MAP = {
    "user-circle": UserCircle,
    "wallet": Wallet,
    "credit-card": CreditCard,
    "gamepad": Gamepad2,
    "gift": Gift,
    "shield-check": ShieldCheck,
    "life-buoy": LifeBuoy,
    "help-circle": HelpCircle,
};

const resolveIcon = (iconKey) => ICON_MAP[iconKey] || HelpCircle;


// ======================================================
// FAQ PAGE (fully backend-driven - see /api/faq)
// ======================================================

export default function FaqContent() {

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [openId, setOpenId] = useState(null);


    const loadFaq = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getFaq();

            if (response?.success) {

                setCategories(response.data || []);

            } else {

                setError(response?.message || "Unable to load FAQ.");

            }

        } catch (fetchError) {

            console.error("FAQ Error:", fetchError);
            setError(fetchError?.message || "Unable to load FAQ.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadFaq();

    }, []);


    // ==================================================
    // FILTERED QUESTIONS
    // ==================================================

    const filteredCategories = useMemo(() => {

        const query = search.trim().toLowerCase();

        return categories
            .filter((category) => activeCategory === "all" || category._id === activeCategory)
            .map((category) => ({
                ...category,
                questions: category.questions.filter((item) => {

                    if (!query) {
                        return true;
                    }

                    return (
                        item.question.toLowerCase().includes(query) ||
                        item.answer.toLowerCase().includes(query)
                    );

                }),
            }))
            .filter((category) => category.questions.length > 0);

    }, [categories, search, activeCategory]);


    const totalQuestions = useMemo(
        () => categories.reduce((sum, category) => sum + category.questions.length, 0),
        [categories]
    );

    const visibleCount = useMemo(
        () => filteredCategories.reduce((sum, category) => sum + category.questions.length, 0),
        [filteredCategories]
    );


    return (
        <UserLayout title="FAQ">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={HelpCircle}
                    eyebrow="Help"
                    title="Frequently Asked Questions"
                    description={
                        <>
                            Answers to common questions about your account, wallet, payments, gaming and support. For
                            policies, see the{" "}
                            <Link href="/legal-help" className="font-semibold text-violet-400 hover:text-violet-300">
                                Legal & Help Center
                            </Link>.
                        </>
                    }
                />

              <div className="mx-auto max-w-5xl">

                {loading ? (
                    <LoadingState label="Loading FAQ..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadFaq} />
                ) : categories.length === 0 ? (
                    <EmptyState message="No FAQs are published yet. Please check back soon." />
                ) : (
                    <>
                        {/* SEARCH */}
                        <div className="relative mb-4">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search FAQs (e.g. withdrawal, referral, OTP)..."
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] py-3 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* CATEGORY FILTER */}
                        <div className="mb-6 flex flex-wrap gap-2">
                            <CategoryPill
                                active={activeCategory === "all"}
                                label="All"
                                onClick={() => setActiveCategory("all")}
                            />
                            {categories.map((category) => (
                                <CategoryPill
                                    key={category._id}
                                    active={activeCategory === category._id}
                                    label={category.name}
                                    icon={resolveIcon(category.icon)}
                                    onClick={() => setActiveCategory(category._id)}
                                />
                            ))}
                        </div>

                        <p className="mb-4 text-[12px] text-slate-600">
                            Showing {visibleCount} of {totalQuestions} questions
                        </p>

                        {/* RESULTS */}
                        {filteredCategories.length === 0 ? (
                            <EmptyState message="No FAQs match your search. Try a different keyword or category." />
                        ) : (
                            <div className="space-y-8">
                                {filteredCategories.map((category) => {

                                    const CategoryIcon = resolveIcon(category.icon);

                                    return (
                                        <div key={category._id}>
                                            <div className="mb-3 flex items-center gap-2">
                                                <CategoryIcon size={16} className="text-violet-400" />
                                                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                                                    {category.name}
                                                </h2>
                                            </div>
                                            <div className="space-y-2">
                                                {category.questions.map((item) => {

                                                    const isOpen = openId === item._id;

                                                    return (
                                                        <div
                                                            key={item._id}
                                                            className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenId(isOpen ? null : item._id)}
                                                                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                                                            >
                                                                <span className="text-sm font-semibold text-white">{item.question}</span>
                                                                <ChevronDown
                                                                    size={16}
                                                                    className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                                />
                                                            </button>
                                                            {isOpen && (
                                                                <div className="whitespace-pre-wrap border-t border-white/[0.05] px-4 py-3.5 text-sm leading-6 text-slate-400">
                                                                    {item.answer}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );

                                                })}
                                            </div>
                                        </div>
                                    );

                                })}
                            </div>
                        )}

                        {/* FOOTER CTA */}
                        <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                            <p className="text-sm text-slate-400">
                                Still have a question?{" "}
                                <Link href="/support" className="font-semibold text-violet-400 hover:text-violet-300">
                                    Contact Support
                                </Link>
                            </p>
                        </div>
                    </>
                )}

              </div>

            </div>
        </UserLayout>
    );

}


// ======================================================
// CATEGORY PILL
// ======================================================

function CategoryPill({ active, label, icon: IconComponent, onClick }) {

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition
                ${active
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"}
            `}
        >
            {IconComponent && <IconComponent size={13} />}
            {label}
        </button>
    );

}
