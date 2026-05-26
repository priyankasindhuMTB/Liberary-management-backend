// config/firebase.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

try {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  
  
  if (!envPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is missing in your .env file");
  }

  // Resolve absolute path and safely read the service account keys
  const resolvedPath = path.resolve(process.cwd(), envPath);
  const serviceAccount = JSON.parse(readFileSync(resolvedPath, "utf8" ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("🔥 Firebase Admin SDK initialized successfully");
} catch (error) {
console.error("❌ Firebase Initialization Failed:", error.message);
}

/**
 * Sends a push notification to a specific device token
 * @param {string} fcmToken - The target device's unique registration token
 * @param {string} title - The notification title header
 * @param {string} body - The main text message body
 */
export const sendPushNotification = async (fcmToken, title, body) => {
  if (!fcmToken) {
    console.warn("⚠️ Cannot send notification: No FCM token provided.");
    return;
  }

  const message = {
    notification: { title, body },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("🚀 Push notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error dispatching FCM cloud message:", error);
  }
};