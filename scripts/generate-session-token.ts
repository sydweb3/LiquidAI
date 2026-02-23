import { SignJWT } from "jose";
import { ENV } from "../server/_core/env";

async function generateSessionToken() {
  // Configuration - customize these values as needed
  const userData = {
    openId: process.env.DEV_OPEN_ID || "dev_user_openid_123",
    appId: process.env.VITE_APP_ID || ENV.appId,
    name: process.env.DEV_USER_NAME || "Developer User"
  };

  const secret = ENV.cookieSecret || "development-secret-key";
  const secretKey = new TextEncoder().encode(secret);
  
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + 365 * 24 * 60 * 60 * 1000) / 1000);

  const token = await new SignJWT({
    openId: userData.openId,
    appId: userData.appId,
    name: userData.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);

  console.log("Generated session token:");
  console.log(token);
  console.log("\nTo use this token:");
  console.log(`1. Set cookie manually in browser: ${process.env.COOKIE_NAME || "app_session_id"}=${token}`);
  console.log(`2. Or set as environment variable: export DEV_SESSION_TOKEN="${token}"`);
  
  return token;
}

generateSessionToken().catch(console.error);