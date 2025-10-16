import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const environment = {
  port: process.env.PORT || 5004,
  databasePath: process.env.DATABASE_PATH || "./data/csv_data.db",
  maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  nodemailer: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || "secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  appName: process.env.APP_NAME || "CSV Ingest Backend",
  nodeEnv: process.env.NODE_ENV || "development",
};
