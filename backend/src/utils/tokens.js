const crypto = require("crypto");

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

module.exports = {
  generateSecureToken,
  hashToken,
  addMinutes
};
