const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const mailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: "Spendly",
        link: process.env.CLIENT_URL || "http://localhost:5173",
        logo: null,
    },
});

const sendEmail = async ({ to, subject, body }) => {
    const emailBody = mailGenerator.generate(body);
    const emailText = mailGenerator.generatePlaintext(body);

    const mailOptions = {
        from: `"Spendly" <${process.env.EMAIL_FROM || "noreply@spendly.app"}>`,
        to,
        subject,
        html: emailBody,
        text: emailText,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (err) {
        console.error("Email send error:", err.message);
        // Don't throw — email failure shouldn't break the request
    }
};

const sendVerificationEmail = async (email, token) => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail({
        to: email,
        subject: "Verify your Spendly account",
        body: {
            body: {
                name: email,
                intro: "Welcome to Spendly! Please verify your email address.",
                action: {
                    instructions: "Click the button below to verify your email:",
                    button: { color: "#6366f1", text: "Verify Email", link: verifyUrl },
                },
                outro: "This link expires in 24 hours.",
            },
        },
    });
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
        to: email,
        subject: "Reset your Spendly password",
        body: {
            body: {
                name: email,
                intro: "You requested a password reset.",
                action: {
                    instructions: "Click the button below to reset your password:",
                    button: { color: "#6366f1", text: "Reset Password", link: resetUrl },
                },
                outro: "This link expires in 1 hour. If you didn't request this, ignore this email.",
            },
        },
    });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
