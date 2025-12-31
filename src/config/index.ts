// import dotenv from "dotenv";

// dotenv.config();

export const config = {
  mobileWallet: {
    merchantUid: process.env.MERCHANT_U_ID || "",
    apiKey: process.env.MERCHANT_API_KEY || "",
    apiUserId: process.env.MERCHANT_API_USER_ID || "",
    apiEndpoint: process.env.MERCHANT_API_END_POINT || "",
  },

  ebir: {
    merchantUid: process.env.EBIR_MERCHANT_U_ID || "",
    apiKey: process.env.EBIR_MERCHANT_API_KEY || "",
    apiUserId: process.env.EBIR_MERCHANT_API_USER_ID || "",
    apiEndpoint: process.env.EBIR_MERCHANT_API_END_POINT || "",
  },

  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 8000,

  database: {
    url: process.env.DATABASE_URL || "mongodb://localhost:27017/headshotpro",
  },
  frontendUrl:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "http://localhost:3000",

  // Email configuration
  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.EMAIL_FROM || "imaginface.ai@gmail.com",
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  // AWS configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucketName: process.env.AWS_BUCKET_NAME || "",
    region: process.env.AWS_REGION || "",
    version: process.env.AWS_VERSION || "2010-12-01",
  },
  // Replicate configuration
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY || "",
  },

  // Upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxStyles: 5, // Maximum number of styles per generation
  },

  // Redis configuration

  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

};
