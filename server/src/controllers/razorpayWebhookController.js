const Razorpay = require("razorpay");

const depositService = require("../services/depositService");
const withdrawalService = require("../services/withdrawalService");
const { createAuditLog } = require("../services/auditLogService");
const { getConfiguredWebhookSecrets } = require("../config/razorpay");


/*
 * ==========================================
 * RAZORPAY WEBHOOK
 * ==========================================
 *
 * Mounted with express.raw() (see app.js) so `req.body` here
 * is a raw Buffer, not parsed JSON - Razorpay's signature
 * check is computed over the exact raw bytes they sent, and
 * verifying against a re-serialized JSON object can produce
 * a different string and fail even for a legitimate request.
 *
 * This is the AUTHORITATIVE confirmation path: it must work
 * correctly even if the frontend verify call never happens
 * (tab closed mid-checkout, network failure, etc).
 */

const handleRazorpayWebhook = async (req, res) => {

    try {

        // Test and Live are separate Razorpay accounts, each
        // with its own webhook secret configured in its own
        // dashboard - the webhook payload itself carries no
        // "mode" field, so verification tries every mode that
        // actually has a secret configured and accepts
        // whichever one matches. With only Test configured
        // (today) this behaves exactly like a single hardcoded
        // secret; a Live event will only ever verify against
        // the Live secret once one exists.

        const configuredSecrets =
            getConfiguredWebhookSecrets();

        if (configuredSecrets.length === 0) {

            console.error(
                "[razorpayWebhook] No Razorpay webhook secret is configured (TEST or LIVE) - rejecting webhook."
            );

            return res.status(503).json({
                success: false,
                message: "Webhook not configured.",
            });

        }

        const signature =
            req.headers["x-razorpay-signature"];

        if (!signature) {

            return res.status(400).json({
                success: false,
                message: "Missing signature.",
            });

        }

        const rawBody =
            Buffer.isBuffer(req.body)
                ? req.body
                : Buffer.from(JSON.stringify(req.body));

        const matchedSecret =
            configuredSecrets.find(
                (entry) =>
                    Razorpay.validateWebhookSignature(
                        rawBody,
                        signature,
                        entry.secret
                    )
            );

        if (!matchedSecret) {

            console.warn(
                "[razorpayWebhook] Invalid signature - rejecting."
            );

            return res.status(400).json({
                success: false,
                message: "Invalid signature.",
            });

        }

        console.log(
            `[razorpayWebhook] Signature verified against ${matchedSecret.mode} mode.`
        );

        const event =
            JSON.parse(rawBody.toString("utf8"));

        const eventType =
            event?.event;

        console.log(
            "[razorpayWebhook] Received event:",
            eventType
        );

        switch (eventType) {

            case "payment.captured": {

                const payment =
                    event?.payload?.payment?.entity;

                if (payment?.order_id && payment?.id) {

                    // The webhook body doesn't carry a
                    // razorpay_signature the way the
                    // checkout redirect does - but the
                    // webhook envelope itself is already
                    // signature-verified above, so this
                    // event is trusted. Credit directly via
                    // the same atomic/idempotent DB flip
                    // confirmRazorpayPayment uses, without
                    // re-checking a per-payment signature.

                    await depositService
                        .confirmRazorpayPaymentTrusted(
                            payment.order_id,
                            payment.id,
                            "webhook"
                        )
                        .catch((error) => {

                            console.error(
                                "[razorpayWebhook] confirm failed:",
                                error.message
                            );

                        });

                }

                break;

            }

            case "payment.failed": {

                const payment =
                    event?.payload?.payment?.entity;

                if (payment?.order_id) {

                    await depositService
                        .markRazorpayPaymentFailed(
                            payment.order_id,
                            payment?.error_description ||
                            "Payment failed"
                        )
                        .catch(() => {});

                }

                break;

            }

            case "refund.processed":
            case "refund.failed": {

                const refund =
                    event?.payload?.refund?.entity;

                if (refund?.id) {

                    await depositService
                        .handleRefundWebhook(
                            refund.id,
                            eventType === "refund.processed" ? "processed" : "failed"
                        )
                        .catch((error) => {

                            console.error(
                                `[razorpayWebhook] ${eventType} handling failed:`,
                                error.message
                            );

                        });

                }

                break;

            }

            case "payout.processed": {

                const payout =
                    event?.payload?.payout?.entity;

                if (payout?.id) {

                    await withdrawalService
                        .handlePayoutWebhook(
                            payout.id,
                            "processed",
                            payout
                        )
                        .catch((error) => {

                            console.error(
                                "[razorpayWebhook] payout.processed handling failed:",
                                error.message
                            );

                        });

                }

                break;

            }

            case "payout.failed":
            case "payout.reversed": {

                const payout =
                    event?.payload?.payout?.entity;

                if (payout?.id) {

                    await withdrawalService
                        .handlePayoutWebhook(
                            payout.id,
                            eventType === "payout.failed"
                                ? "failed"
                                : "reversed",
                            payout
                        )
                        .catch((error) => {

                            console.error(
                                `[razorpayWebhook] ${eventType} handling failed:`,
                                error.message
                            );

                        });

                }

                break;

            }

            default: {

                // Unhandled event types are fine to ignore -
                // just acknowledge receipt so Razorpay doesn't
                // keep retrying.

                break;

            }

        }

        await createAuditLog({
            actorType: "system",
            action: "webhook.razorpay_received",
            module: "wallet",
            key: eventType || "unknown",
            metadata: {
                eventId: event?.id || null,
            },
        }).catch(() => {});

        return res.status(200).json({ success: true });

    } catch (error) {

        console.error(
            "[razorpayWebhook] Unhandled error:",
            error.message
        );

        // Still 200 so Razorpay doesn't hammer us with
        // retries for a bug on our side that a retry won't
        // fix - the reconciliation admin tool covers the gap.

        return res.status(200).json({ success: false });

    }

};


module.exports = {
    handleRazorpayWebhook,
};
