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
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error("EMAIL_FROM is not configured");
    }

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

module.exports = {
  sendEmail
};
