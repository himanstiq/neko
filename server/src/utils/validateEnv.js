import logger from "./logger.js";

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL"];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  logger.info("Environment variables validated successfully");
};

export default validateEnv;
