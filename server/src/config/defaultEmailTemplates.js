/*
 * ==========================================
 * DEFAULT EMAIL TEMPLATES (seed data)
 * ==========================================
 *
 * Mirrors config/defaultSettings.js's own seed pattern - only
 * inserted if a template with this `key` doesn't already exist
 * (see seeders/emailTemplateSeeder.js), so re-running the
 * seeder never overwrites an admin's edits.
 *
 * `body` is plain text with {{placeholders}} - it is rendered
 * inside the shared professional HTML shell automatically
 * (see emailShellService.js), so admins only ever edit the
 * message itself, never page structure/branding.
 */

const defaultEmailTemplates = [

    {
        key: "welcome",
        name: "Welcome / Registration Email",
        description: "Sent to a new user right after their account is created.",
        subject: "Welcome to {{site_name}}!",
        body:
            "Hi {{user_name}},\n\n" +
            "Your account on {{site_name}} has been created successfully.\n\n" +
            "Username: {{username}}\n" +
            "Email: {{email}}\n\n" +
            "You can now log in and start playing. If you did not create this account, please contact support immediately.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["user_name", "username", "email", "site_name"],
        isActive: true,
    },

    {
        key: "admin_new_user",
        name: "Admin: New User Registered",
        description: "Sent to the configured support email whenever a new user registers.",
        subject: "New user registered - {{site_name}}",
        body:
            "A new user has registered on {{site_name}}.\n\n" +
            "Name: {{user_name}}\n" +
            "Username: {{username}}\n" +
            "Email: {{email}}\n" +
            "Registered At: {{registered_at}}\n\n" +
            "This is an automated notification - no action is required.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["user_name", "username", "email", "registered_at", "site_name"],
        isActive: true,
    },

    {
        key: "admin_welcome",
        name: "Admin: Welcome / Account Created",
        description: "Sent to a new admin right after their account is auto-created by the admin seeder.",
        subject: "Your admin account on {{site_name}} is ready",
        body:
            "Hi {{name}},\n\n" +
            "An admin account has been created for you on {{site_name}}.\n\n" +
            "Username: {{username}}\n" +
            "Email: {{email}}\n" +
            "Role: {{role}}\n\n" +
            "Log in with the username/email above and the password that was configured for this account. If you did not expect this account to be created, please contact a super admin immediately.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["name", "username", "email", "role", "site_name"],
        isActive: true,
    },

    {
        key: "forgot_password",
        name: "User: Forgot Password Code",
        description: "Sent to a user who requested a password reset code.",
        subject: "Reset your password",
        body:
            "Your password reset code is {{otp}}.\n\n" +
            "It expires in {{otp_expiry_minutes}} minutes.\n\n" +
            "If you did not request this, you can safely ignore this email - your password will not be changed.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["otp", "otp_expiry_minutes", "site_name"],
        isActive: true,
    },

    {
        key: "password_reset_confirmation",
        name: "User: Password Reset Confirmation",
        description: "Sent to a user right after their password was successfully reset.",
        subject: "Your password has been reset",
        body:
            "Your password has been successfully reset.\n\n" +
            "If you did not perform this action, please contact support immediately.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["site_name"],
        isActive: true,
    },

    {
        key: "admin_forgot_password",
        name: "Admin: Forgot Password Code",
        description: "Sent to an admin who requested a password reset code.",
        subject: "Reset your admin password",
        body:
            "Your admin password reset code is {{otp}}.\n\n" +
            "It expires in {{otp_expiry_minutes}} minutes.\n\n" +
            "If you did not request this, you can safely ignore this email - your password will not be changed.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["otp", "otp_expiry_minutes", "site_name"],
        isActive: true,
    },

    {
        key: "admin_password_reset_confirmation",
        name: "Admin: Password Reset Confirmation",
        description: "Sent to an admin right after their password was successfully reset.",
        subject: "Your admin password has been reset",
        body:
            "Your admin account password has been successfully reset.\n\n" +
            "If you did not perform this action, please contact a super admin immediately.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["site_name"],
        isActive: true,
    },

    {
        key: "otp_verify_email",
        name: "OTP: Verify Email Address",
        description: "Sent when a user requests an email-verification code.",
        subject: "Verify your email",
        body:
            "Your verification code is {{otp}}.\n\n" +
            "It expires in {{otp_expiry_minutes}} minutes. Do not share this code with anyone.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["otp", "otp_expiry_minutes", "site_name"],
        isActive: true,
    },

    {
        key: "otp_change_email",
        name: "OTP: Confirm New Email Address",
        description: "Sent to a user's NEW email address to confirm an email-change request.",
        subject: "Confirm your new email",
        body:
            "Your verification code is {{otp}}.\n\n" +
            "It expires in {{otp_expiry_minutes}} minutes. Do not share this code with anyone.",
        ctaText: "",
        ctaUrlVariable: "",
        variables: ["otp", "otp_expiry_minutes", "site_name"],
        isActive: true,
    },

];

module.exports = defaultEmailTemplates;
