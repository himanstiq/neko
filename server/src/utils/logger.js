const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "info"];

const formatMessage = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
};

const logger = {
  error: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage("ERROR", message, meta));
    }
  },
  warn: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage("WARN", message, meta));
    }
  },
  info: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.info(formatMessage("INFO", message, meta));
    }
  },
  debug: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(formatMessage("DEBUG", message, meta));
    }
  },
};

export default logger;
