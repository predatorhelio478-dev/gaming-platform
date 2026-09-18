const FaqCategory = require("../models/FaqCategory");
const FaqItem = require("../models/FaqItem");

/*
 * ==========================================
 * DEFAULT FAQ SEED
 * ==========================================
 *
 * Only runs when NO FaqCategory documents exist yet (unlike
 * the settings/email-template seeders, FAQ content has no
 * natural unique "key" per question - so this seeds the whole
 * set once, on a fresh install, and never touches the
 * collection again once an admin has anything in it).
 *
 * Answers deliberately avoid hardcoding specific limits/amounts
 * (those live in Settings and the Deposit/Withdrawal/Legal &
 * Help pages, which read them live) - FAQ content here is
 * accurate to the actual implemented features without risking
 * going stale if an admin later changes a limit in Settings.
 */

const seedData = [

    {
        name: "Account",
        icon: "user-circle",
        questions: [
            { question: "How do I register an account?", answer: "Sign up with your full name, a unique username, a valid email address and a password. Mobile number is optional at signup." },
            { question: "How do I log in?", answer: "Log in with your username or email address and your password." },
            { question: "I forgot my password - what do I do?", answer: "Click \"Forgot password?\" on the login page, enter your username or email, and we'll email you a 6-digit reset code. Enter that code along with your new password to complete the reset, then log in with your new password." },
            { question: "What is email OTP used for?", answer: "Email OTP (a 6-digit one-time code sent to your inbox) is used to verify your email address, and to confirm it's really you during a password reset." },
            { question: "What is mobile OTP used for?", answer: "Mobile OTP is used to verify the mobile number on your account, where required." },
            { question: "How can I keep my account secure?", answer: "Use a strong, unique password, verify your email and mobile number, and never share your password or any OTP code with anyone - our team will never ask you for either." },
            { question: "Can I deactivate my own account?", answer: "There is currently no self-service deactivation option. Please raise a Support ticket to request that our team deactivate your account." },
            { question: "Can I permanently delete my account?", answer: "Permanent account deletion is handled by our administrators on request. It anonymizes your personal details so the account can never be logged into again, while your financial, betting and audit history is preserved for accounting/legal purposes. Raise a Support ticket to request this." },
        ],
    },

    {
        name: "Wallet & Money",
        icon: "wallet",
        questions: [
            { question: "What is Test Balance?", answer: "A one-time balance credited to every new account on first login. It's for practice play only and can never be withdrawn or converted to real money." },
            { question: "What is Real Balance?", answer: "Your actual money - credited from successful deposits and from winnings on real-money bets. This is the balance that can be withdrawn, subject to our withdrawal policy." },
            { question: "What is Bonus Balance?", answer: "Balance credited from referral bonuses. Up to 30% of each real-money bet is automatically covered from Bonus Balance (the rest always comes from Real Balance). If that bet wins, the bonus portion simply returns to Bonus Balance - it never converts to real money." },
            { question: "What is the minimum and maximum deposit?", answer: "Current deposit limits are shown on the Deposit page and in the Legal & Help Center." },
            { question: "What is the minimum and maximum withdrawal?", answer: "Current withdrawal limits are shown on the Withdrawal page and in the Legal & Help Center." },
            { question: "How does the deposit process work?", answer: "Go to the Deposit page - depending on current configuration, pay via Razorpay's secure checkout (credited automatically once verified) or submit a manual payment reference for admin review." },
            { question: "How does the withdrawal process work?", answer: "Go to the Withdrawal page and submit your amount and payout details (Bank Transfer or UPI). Your email (and mobile, if required) must be verified first." },
            { question: "What do pending, failed and successful withdrawals mean?", answer: "\"Pending\" means your request is awaiting processing or admin review. \"Approved\" means it has been paid out. \"Rejected\" means the request was declined and the held amount is released back to your wallet." },
            { question: "Are refunds available?", answer: "Bets cannot be cancelled or refunded once placed. Successful deposits are generally not refundable except in error cases, which an administrator can review. See the Legal & Help Center for the full Refund & Cancellation Policy." },
        ],
    },

    {
        name: "Razorpay",
        icon: "credit-card",
        questions: [
            { question: "How are Razorpay payments processed?", answer: "When automatic deposits are enabled, choosing to pay opens Razorpay's secure checkout for your amount. Your wallet is credited only after your payment is verified by our servers - never before." },
            { question: "What happens after a successful payment?", answer: "Your wallet is credited automatically for the exact amount paid, a transaction record is created, and you'll see the updated balance immediately." },
            { question: "What happens if a payment fails?", answer: "No amount is deducted from your wallet. The deposit request is marked as failed and you can try again." },
            { question: "What does a \"pending\" payment mean?", answer: "Your payment was submitted but hasn't been confirmed by Razorpay yet. Our system automatically confirms it once Razorpay reports the outcome." },
            { question: "What is payment reconciliation?", answer: "If a payment's final outcome isn't confirmed automatically, an administrator can look up its real status directly with Razorpay and resolve your deposit request accordingly." },
            { question: "I have a refund or payment issue - what should I do?", answer: "Please raise a Support ticket under the \"Payment\" or \"Deposit\" category with your transaction reference, and our team will investigate." },
        ],
    },

    {
        name: "Gaming",
        icon: "gamepad",
        questions: [
            { question: "What is Color Prediction?", answer: "Our game where you choose Red, Green or Blue each round and place a bet before the round's countdown ends. If the round result matches your color, you win." },
            { question: "How do game rounds work?", answer: "Rounds run continuously: a betting window opens, you place your bet, betting locks automatically when the timer ends, the result is generated, payouts are settled, and the next round begins shortly after." },
            { question: "How long is the round timer?", answer: "The round duration is configured by the platform and shown live on the game screen." },
            { question: "How are game results decided?", answer: "Results are generated by our server-side game engine only after betting for that round has closed. No player, admin action during the round, or part of the website interface can influence or predict the outcome." },
            { question: "What are the betting rules?", answer: "Minimum/maximum bet amounts are shown on the game screen. You may place one bet per round, using Real or Test balance, and you can increase your existing bet on the same color while more than 5 seconds remain. Real-money bets automatically use up to 30% Bonus balance where available - see the Bonus & Referral section for details." },
            { question: "Where can I see my bet history?", answer: "Visit the My Bets page to see every bet you've placed, including the color, amount, result, payout status and payout amount." },
            { question: "Is the game fair?", answer: "Yes - every round's result is generated strictly after betting closes, and every bet, round and payout is logged in our systems for auditing." },
        ],
    },

    {
        name: "Bonus & Referral",
        icon: "gift",
        questions: [
            { question: "What is bonus balance and how do I get it?", answer: "Bonus balance comes from our referral program - either as an immediate signup bonus for entering a valid referral code, or as a reward paid to the person who referred you. It isn't purchased or deposited directly, and it's automatically applied to your real-money bets (see below)." },
            { question: "How is Bonus Balance used when I place a bet?", answer: "For each real-money bet, up to 30% of the bet amount can be covered using Bonus Balance and the remaining 70% is always taken from Real Money Balance. For example, on a ₹10 bet, ₹3 may come from Bonus Balance and ₹7 from Real Money Balance. If your bonus balance is less than 30% of the bet, only what's available is used and the rest comes from Real Money Balance. If the bet wins, the bonus portion returns to Bonus Balance exactly as it was, while the winning payout on the real-money portion is credited as Real Money according to the applicable payout multiplier. If the bet loses, both portions are lost as normal." },
            { question: "Does every user get a referral code?", answer: "Yes - every registered user automatically receives their own unique referral code, visible on the Referrals page, which they can share with friends." },
            { question: "What happens when I register using someone else's referral code?", answer: "If you enter another user's valid referral code during registration, you immediately receive a ₹200 bonus balance credit (subject to the referral code being valid, not your own, and this being the only time it's applied to your account)." },
            { question: "How does the referral system work?", answer: "Share your referral code or link (found on the Referrals page) with a friend. When they sign up using your code, they receive a signup bonus. When they go on to place their first real-money bet, you're credited a referral bonus too." },
            { question: "How much is the referral bonus?", answer: "The current referral bonus amount is shown on the Referrals page." },
            { question: "How does bonus balance convert to real money?", answer: "Bonus balance used in a bet is never converted - if that bet wins, the exact bonus amount used simply returns to your Bonus Balance, and only the real-money portion's winnings are credited as Real Money. Bonus balance is for betting only and cannot be withdrawn directly." },
            { question: "Are there any other bonuses or promotions?", answer: "Currently only the welcome Test Balance and the referral bonuses described above are available. We do not offer any other bonuses or promotions at this time." },
        ],
    },

    {
        name: "Verification & Security",
        icon: "shield-check",
        questions: [
            { question: "Does this platform require KYC (document verification)?", answer: "No - we do not currently require document-based identity verification. \"Verification\" here means confirming your email address (and mobile number, where required) via a one-time password (OTP)." },
            { question: "How does email verification work?", answer: "We send a 6-digit code to your email address. Enter it on the verification screen to confirm your email." },
            { question: "How does mobile verification work?", answer: "We send a 6-digit code to your mobile number. Enter it to confirm your number." },
            { question: "How is my account protected?", answer: "Passwords are stored using industry-standard hashing (never in plain text), login attempts are rate-limited, verification and password-reset codes are single-use and expire automatically, and sensitive account actions are logged for audit purposes." },
            { question: "Will I be notified about important account activity?", answer: "Yes - you'll receive in-app notifications (and email, where enabled) for events like deposits, withdrawals, and other account activity." },
        ],
    },

    {
        name: "Support",
        icon: "life-buoy",
        questions: [
            { question: "How do I contact support?", answer: "Raise a ticket from the Support page for the fastest response, or use the contact details shown there." },
            { question: "What is a support ticket?", answer: "A ticket is a conversation thread with our team about a specific issue, categorized by topic and priority." },
            { question: "How do I report an issue?", answer: "Go to Support, create a new ticket, choose the closest category and priority, and describe your issue in detail. Our team will reply directly within the ticket thread." },
            { question: "My deposit isn't showing in my wallet - what should I do?", answer: "Check the Deposit page for your request's current status. If it has been pending for an unusually long time, raise a Support ticket under \"Deposit\" with your payment reference." },
            { question: "My withdrawal is delayed - what should I do?", answer: "Check the Withdrawal page for your request's current status. If it's been pending for an unusually long time, raise a Support ticket under \"Withdrawal\" so our team can look into it." },
            { question: "I can't log in - what should I do?", answer: "Double-check your username/email and password. If you've forgotten your password, use \"Forgot password?\" on the login page. If you're still stuck, raise a Support ticket." },
        ],
    },

];

const seedFaq = async () => {
    try {
        const existingCount = await FaqCategory.countDocuments({});

        if (existingCount > 0) {
            return;
        }

        let categoryOrder = 0;

        for (const category of seedData) {

            const createdCategory = await FaqCategory.create({
                name: category.name,
                icon: category.icon,
                order: categoryOrder,
                isActive: true,
            });

            categoryOrder += 1;

            let itemOrder = 0;

            for (const item of category.questions) {

                await FaqItem.create({
                    category: createdCategory._id,
                    question: item.question,
                    answer: item.answer,
                    order: itemOrder,
                    isActive: true,
                });

                itemOrder += 1;

            }

        }

        console.log("FAQ seeded successfully.");
    } catch (error) {
        console.error("FAQ seeding failed:", error.message);
        throw error;
    }
};

module.exports = seedFaq;
