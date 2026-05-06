export const env = {
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/jira_task_manager",
  nodeEnv: process.env.NODE_ENV ?? "development",
  accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-before-production",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-before-production",
};

export const isProduction = env.nodeEnv === "production";
