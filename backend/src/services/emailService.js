const { Resend } = require("resend");
const logger = require("../utils/logger");

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

const sendEmail = async (to, subject, html) => {
  try {
    const from = process.env.EMAIL_FROM || "TaskHive <onboarding@resend.dev>";
    const resend = getResendClient();

    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
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
  return sendEmail(
    to,
    "You have been invited to TaskHive",
    `
      <h2>You have been invited to TaskHive</h2>
      <p>Click the link below to create your password:</p>
      <a href="${inviteLink}">${inviteLink}</a>
      <p>This link expires in 24 hours.</p>
    `
  );
};

module.exports = {
  sendEmail,
  sendInviteEmail
};
