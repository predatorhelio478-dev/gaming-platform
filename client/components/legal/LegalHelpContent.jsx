"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import {
    FileText,
    ShieldCheck,
    HeartHandshake,
    AlertTriangle,
    RotateCcw,
    ArrowDownCircle,
    ArrowUpCircle,
    Gamepad2,
    Scale,
    UserCheck,
    UserX,
    Gift,
    CreditCard,
    LifeBuoy,
    Clock,
    Menu,
    X,
} from "lucide-react";

import UserLayout from "../user/UserLayout";
import UserPageHeader from "../user/UserPageHeader";
import { LoadingState, ErrorState } from "../user/PageState";
import { getPublicSettings } from "../../lib/api";


// ======================================================
// HELPERS
// ======================================================

const formatCurrency = (value) => {

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "-";
    }

    return `₹${amount.toLocaleString("en-IN")}`;

};

const formatDate = (value) => {

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);

};

const renderTextBlock = (text, fallback) => {

    const clean = String(text || "").trim();

    if (!clean) {

        return (
            <p className="text-sm italic leading-6 text-slate-500">
                {fallback}
            </p>
        );

    }

    return (
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
            {clean}
        </p>
    );

};


// ======================================================
// LEGAL & HELP PAGE
// ======================================================

export default function LegalHelpContent() {

    const [settings, setSettings] = useState(null);
    const [legalUpdatedAt, setLegalUpdatedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("");
    const [tocOpen, setTocOpen] = useState(false);

    const sectionRefs = useRef({});


    // ==================================================
    // LOAD SETTINGS
    // ==================================================

    const loadSettings = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getPublicSettings();

            setSettings(response?.data || {});
            setLegalUpdatedAt(response?.legalUpdatedAt || null);

        } catch (fetchError) {

            console.error("Legal & Help Settings Error:", fetchError);
            setError(fetchError?.message || "Unable to load page content.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadSettings();

    }, []);


    // ==================================================
    // SECTIONS (built from live settings - never hardcoded
    // where a Settings value already exists)
    // ==================================================

    const sections = useMemo(() => {

        const general = settings?.general || {};
        const payment = settings?.payment || {};
        const game = settings?.game || {};
        const user = settings?.user || {};
        const legal = settings?.legal || {};

        const siteName = general.site_name || "this platform";

        return [

            {
                id: "terms",
                icon: FileText,
                title: "Terms & Conditions",
                body: renderTextBlock(
                    legal.terms_and_conditions,
                    `Our full Terms & Conditions will be published here by the ${siteName} team. Please contact Support if you have questions in the meantime.`
                ),
            },

            {
                id: "privacy",
                icon: ShieldCheck,
                title: "Privacy Policy",
                body: renderTextBlock(
                    legal.privacy_policy,
                    `Our full Privacy Policy will be published here by the ${siteName} team. Please contact Support if you have questions in the meantime.`
                ),
            },

            {
                id: "responsible-gaming",
                icon: HeartHandshake,
                title: "Responsible Gaming",
                body: (
                    <div className="space-y-3">
                        {renderTextBlock(
                            legal.responsible_gaming,
                            `${siteName} is intended for adults who choose to play for entertainment.`
                        )}
                        <p className="text-sm leading-6 text-slate-400">
                            Please play responsibly: only wager amounts you can afford to lose, take regular breaks, and never chase losses. If you feel your play is becoming a problem, stop and seek independent support in your area.
                        </p>
                    </div>
                ),
            },

            {
                id: "disclaimer",
                icon: AlertTriangle,
                title: "Disclaimer",
                body: (
                    <p className="text-sm leading-6 text-slate-400">
                        Games on {siteName}, including Color Prediction, involve financial risk. Round results are generated and settled automatically by our server-side game engine and cannot be predicted or guaranteed by us, our staff, or any third party. Past results never indicate future outcomes. {siteName} does not guarantee any winnings and is not liable for losses incurred while using the platform. It is your responsibility to confirm that online gaming is legal in your jurisdiction before participating.
                    </p>
                ),
            },

            {
                id: "refund-cancellation",
                icon: RotateCcw,
                title: "Refund & Cancellation Policy",
                body: (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-400">
                        <li>
                            <span className="font-semibold text-slate-300">Bets:</span> once placed for a round, a bet cannot be cancelled or refunded - each round is time-boxed and settles automatically once betting closes.
                        </li>
                        <li>
                            <span className="font-semibold text-slate-300">Deposits:</span> amounts successfully credited to your wallet are not refundable except where required by law or at our discretion (for example, a duplicate or erroneous Razorpay payment, which an administrator can refund back to your original payment method).
                        </li>
                        <li>
                            <span className="font-semibold text-slate-300">Withdrawals:</span> a withdrawal request can only be cancelled by contacting Support before it has been processed by an administrator.
                        </li>
                    </ul>
                ),
            },

            {
                id: "deposit-policy",
                icon: ArrowDownCircle,
                title: "Deposit Policy",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Deposits" value={payment.deposit_enabled === false ? "Currently disabled" : "Currently enabled"} />
                            <SettingFact label="Minimum deposit" value={formatCurrency(payment.minimum_deposit)} />
                            <SettingFact label="Maximum deposit" value={formatCurrency(payment.maximum_deposit)} />
                            <SettingFact label="Processing mode" value={payment.payment_mode === "automatic" ? "Automatic (Razorpay)" : "Manual review"} />
                        </div>
                        <p>
                            {payment.payment_mode === "automatic"
                                ? "Deposits are currently processed automatically through Razorpay's secure checkout - your wallet is credited only once your payment is verified."
                                : "Deposits are currently reviewed manually - submit your payment reference (UPI, Bank Transfer, or Other) and our team will verify and credit your wallet."}
                            {" "}Depending on configuration, either method may be available, and the platform may switch between them at any time.
                        </p>
                    </div>
                ),
            },

            {
                id: "withdrawal-policy",
                icon: ArrowUpCircle,
                title: "Withdrawal Policy",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Withdrawals" value={payment.withdrawal_enabled === false ? "Currently disabled" : "Currently enabled"} />
                            <SettingFact label="Minimum withdrawal" value={formatCurrency(payment.minimum_withdrawal)} />
                            <SettingFact label="Maximum withdrawal" value={formatCurrency(payment.maximum_withdrawal)} />
                            <SettingFact label="Minimum real balance required" value={formatCurrency(payment.minimum_real_balance_for_withdrawal)} />
                            <SettingFact label="Processing mode" value={payment.withdrawal_mode === "automatic" ? "Automatic (RazorpayX)" : "Manual review"} />
                        </div>
                        <p>
                            Your email{user.mobile_verification_required ? " and mobile number" : ""} must be verified before you can request a withdrawal. Withdrawals are paid out via Bank Transfer or UPI, and are either processed automatically or reviewed by our team before payout, depending on current configuration.
                        </p>
                    </div>
                ),
            },

            {
                id: "betting-rules",
                icon: Gamepad2,
                title: "Betting & Game Rules",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Games" value={game.games_enabled === false ? "Currently disabled" : "Currently enabled"} />
                            <SettingFact label="Minimum bet" value={formatCurrency(game.minimum_bet)} />
                            <SettingFact label="Maximum bet" value={formatCurrency(game.maximum_bet)} />
                            <SettingFact label="Round duration" value={game.round_duration ? `${game.round_duration} seconds` : "-"} />
                            <SettingFact label="Payout multiplier" value={game.payout_multiplier ? `${game.payout_multiplier}x` : "-"} />
                        </div>
                        <p>
                            In Color Prediction, choose Red, Green or Blue and place your bet before the round&apos;s countdown ends. Betting closes automatically when the timer reaches zero - no further bets are accepted after that point. The round result is generated by our server after betting closes, and a winning bet is paid at the current payout multiplier.
                        </p>
                    </div>
                ),
            },

            {
                id: "fair-play",
                icon: Scale,
                title: "Fair Play Policy",
                body: (
                    <p className="text-sm leading-6 text-slate-400">
                        Every round result is generated exclusively by our backend game engine after betting for that round has already closed - never before, and never influenced by any single player&apos;s bet, admin action, or the website interface. Bets, results and payouts are all recorded in our systems, giving every round a consistent, auditable record.
                    </p>
                ),
            },

            {
                id: "kyc-verification",
                icon: UserCheck,
                title: "KYC & Verification Policy",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Email verification" value={user.email_verification_required === false ? "Optional" : "Required"} />
                            <SettingFact label="Mobile verification" value={user.mobile_verification_required === false ? "Optional" : "Required"} />
                        </div>
                        <p>
                            {siteName} verifies your email address and mobile number using a one-time password (OTP) sent directly to you. We do not currently require additional document-based identity verification (KYC) to use the platform; this may change in the future if required by law or by our payment processing partners.
                        </p>
                    </div>
                ),
            },

            {
                id: "account-deletion",
                icon: UserX,
                title: "Account Deactivation & Permanent Deletion Policy",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <p>
                            Account deactivation and permanent deletion are handled by our administrators, typically in response to a request you submit through Support.
                        </p>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>
                                <span className="font-semibold text-slate-300">Deactivation</span> immediately blocks login while preserving your betting, transaction and referral history. It can be reversed by an administrator.
                            </li>
                            <li>
                                <span className="font-semibold text-slate-300">Permanent deletion</span> anonymizes your personal account details (name, username, email, mobile, password) so the account can never be logged into again. Your financial, betting and audit history is preserved for accounting/legal purposes but is no longer linked to identifiable personal information.
                            </li>
                        </ul>
                        <p>
                            To request deactivation or permanent deletion of your account, please{" "}
                            <Link href="/support" className="font-semibold text-violet-400 hover:text-violet-300">
                                raise a Support ticket
                            </Link>.
                        </p>
                    </div>
                ),
            },

            {
                id: "bonus-referral",
                icon: Gift,
                title: "Bonus & Referral Policy",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Welcome test balance" value={formatCurrency(user.test_welcome_balance)} />
                            <SettingFact label="Referral program" value={user.referral_enabled === false ? "Currently disabled" : "Currently enabled"} />
                            <SettingFact label="Referral bonus" value={formatCurrency(user.referral_bonus_amount)} />
                            <SettingFact label="Bonus win conversion" value={user.bonus_conversion_rate != null ? `${user.bonus_conversion_rate}%` : "-"} />
                        </div>
                        <p>
                            New users receive a one-time TEST balance on their first login, for practice play only - it can never be withdrawn or converted. Share your referral code: once a user you referred places their first real-money bet, you receive the referral bonus above in bonus balance. Bonus balance can be used to place bets; when a bonus-funded bet wins, the listed percentage of the winnings converts to your real (withdrawable) balance, and the remainder stays as bonus balance.
                        </p>
                    </div>
                ),
            },

            {
                id: "payment-policy",
                icon: CreditCard,
                title: "Payment / Razorpay Policy",
                body: (
                    <p className="text-sm leading-6 text-slate-400">
                        Depending on current configuration, deposits are processed either automatically through Razorpay&apos;s secure payment checkout, or manually reviewed by our team after you submit a payment reference. Your wallet is only ever credited once a Razorpay payment is verified by our servers, or once an administrator approves a manual deposit. Withdrawals may similarly be processed automatically via RazorpayX payouts or manually reviewed by our team. We never see or store your card, UPI or bank credentials - all payment processing is handled directly and securely by Razorpay.
                    </p>
                ),
            },

            {
                id: "contact-support",
                icon: LifeBuoy,
                title: "Contact & Support",
                body: (
                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <SettingFact label="Support email" value={general.support_email || "Not published yet"} />
                            <SettingFact label="Support phone" value={general.support_phone || "Not published yet"} />
                        </div>
                        <p>
                            Need help? Raise a ticket from our{" "}
                            <Link href="/support" className="font-semibold text-violet-400 hover:text-violet-300">
                                Support page
                            </Link>{" "}
                            for the fastest response, or check our{" "}
                            <Link href="/faq" className="font-semibold text-violet-400 hover:text-violet-300">
                                FAQ
                            </Link>{" "}
                            for answers to common questions.
                        </p>
                    </div>
                ),
            },

        ];

    }, [settings]);


    // ==================================================
    // SCROLL SPY
    // ==================================================

    useEffect(() => {

        if (!sections.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {

                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id);
                }

            },
            {
                rootMargin: "-96px 0px -70% 0px",
                threshold: 0,
            }
        );

        sections.forEach((section) => {

            const el = sectionRefs.current[section.id];

            if (el) {
                observer.observe(el);
            }

        });

        return () => observer.disconnect();

    }, [sections]);


    const handleTocClick = (id) => {

        setTocOpen(false);

        const el = sectionRefs.current[id];

        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

    };


    const lastUpdatedLabel = formatDate(legalUpdatedAt);


    return (
        <UserLayout title="Legal & Help">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={Scale}
                    eyebrow="Policies"
                    title="Legal & Help Center"
                    description={
                        <>
                            Everything you need to know about how {settings?.general?.site_name || "our platform"} works - policies, limits and support, all in one place.
                            {lastUpdatedLabel && (
                                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                                    <Clock size={12} />
                                    Last updated: {lastUpdatedLabel}
                                </span>
                            )}
                        </>
                    }
                />

              <div className="mx-auto">

                {/* MOBILE TOC TOGGLE */}
                <button
                    type="button"
                    onClick={() => setTocOpen((current) => !current)}
                    className="mb-4 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white lg:hidden"
                >
                    <span className="flex items-center gap-2">
                        <Menu size={16} />
                        Jump to section
                    </span>
                    {tocOpen ? <X size={16} /> : null}
                </button>

                {loading ? (
                    <LoadingState label="Loading page content..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadSettings} />
                ) : (
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

                        {/* ==========================================
                            STICKY TABLE OF CONTENTS
                        ========================================== */}

                        <nav
                            className={`
                                ${tocOpen ? "block" : "hidden"}
                                shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3
                                lg:sticky lg:top-20 lg:block lg:w-64 lg:self-start
                            `}
                        >
                            <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                On this page
                            </p>
                            <ul className="space-y-0.5">
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleTocClick(section.id)}
                                            className={`
                                                flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition
                                                ${activeSection === section.id
                                                    ? "bg-violet-500/15 font-semibold text-violet-300"
                                                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}
                                            `}
                                        >
                                            <section.icon size={14} className="shrink-0" />
                                            <span className="truncate">{section.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* ==========================================
                            SECTIONS
                        ========================================== */}

                        <div className="min-w-0 flex-1 space-y-5">
                            {sections.map((section) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    ref={(el) => { sectionRefs.current[section.id] = el; }}
                                    className="scroll-mt-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.08] text-violet-300">
                                            <section.icon size={18} />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">{section.title}</h2>
                                    </div>
                                    {section.body}
                                </section>
                            ))}
                        </div>

                    </div>
                )}

              </div>

            </div>
        </UserLayout>
    );

}


// ======================================================
// SETTING FACT (small label/value pair)
// ======================================================

function SettingFact({ label, value }) {

    return (
        <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-slate-300">{value}</p>
        </div>
    );

}
