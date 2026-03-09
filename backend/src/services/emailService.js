const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { buildInviteEmailHtml } = require("../mail/inviteTemplate");

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error("EMAIL_FROM is not configured");
    }

    const transporter = getTransporter();
    const result = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: html.replace(/<[^>]+>/g, " ")
    });

    return result;
  } catch (error) {
    logger.error("Email send failed", {
      message: error?.message || "Unknown email error",
      name: error?.name || "Error"
    });
    throw new Error(`Email delivery failed: ${error?.message || "unknown error"}`);
  }
};

const sendInviteEmail = async ({ to, inviteLink }) => {
  return sendEmail(to, "Welcome to TaskHive", buildInviteEmailHtml({ inviteLink }));
};

module.exports = {
  sendEmail,
  sendInviteEmail
};
