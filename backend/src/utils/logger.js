const formatMeta = (meta = {}) => {
  try {
    return JSON.stringify(meta);
  } catch (_err) {
    return "{}";
  }
};

const log = (level, message, meta = {}) => {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message} ${formatMeta(meta)}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
};

module.exports = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta)
};
