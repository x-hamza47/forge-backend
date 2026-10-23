const required = ["MONGODB_URI", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,
};