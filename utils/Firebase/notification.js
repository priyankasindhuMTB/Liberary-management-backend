// utils/firebase/notification.js
import admin from "firebase-admin";

// Keep a flag to track if Firebase has initialized successfully
let isFirebaseInitialized = false;

const initializeFirebase = () => {
  // If it's already initialized, skip doing it again
  if (isFirebaseInitialized) return true;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("TYPE:", serviceAccount.type);
      console.log("PROJECT:", serviceAccount.project_id);
      console.log("CLIENT:", serviceAccount.client_email);
      console.log("PRIVATE KEY START:", serviceAccount.private_key?.substring(0, 30)
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      // console.log("🔥 Firebase Admin SDK initialized successfully via Environment Variables.");
      isFirebaseInitialized = true;
      return true;
    } else {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT is missing from environment variables.");
      return false;
    }
  } catch (error) {
    console.error("❌ Failed to parse or initialize Firebase Admin SDK:", error.message);
    return false;
  }
};

/**
 * Sends a single Push Notification using Firebase HTTP/v1 API
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  console.log("=================================");
  console.log("FCM TOKEN RECEIVED:", fcmToken);
  console.log("TITLE:", title);
  console.log("BODY:", body);
  console.log("=================================");

  // 🧠 SMART MOVE: Initialize Firebase right here, only when a notification is actually triggered!
  // By this time, dotenv is guaranteed to have loaded your variables.
  const initialized = initializeFirebase();
  if (!initialized) {
    console.log("⚠️ Notification aborted: Firebase Admin SDK is not initialized.");
    return;
  }
  console.log("APP NAME:", admin.app().name);
  console.log("APP OPTIONS:", admin.app().options);

  if (!fcmToken) {
    console.log("⚠️ Notification skipped: No FCM token provided.");
    return;
  }

  const stringifiedData = {};
  Object.keys(data).forEach((key) => {
    stringifiedData[key] = String(data[key]);
  });

  const message = {
    token: fcmToken,

    notification: {
      title,
      body,
    },

    webpush: {
      notification: {
        title,
        body,
        icon: "/vite.svg",
        requireInteraction: true,
      },

      fcmOptions: {
        link: `${process.env.FRONTEND_URL}${data.url || "/"}`
      }
    },

    data: stringifiedData,
  };
  console.log("NOTIFICATION>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:", message);
  console.log("TOKEN USED FOR SEND:", fcmToken);
  console.log("TITLE:", title);
  console.log("BODY:", body);

  try {
    const accessToken =
      await admin.app().options.credential.getAccessToken();

    console.log("ACCESS TOKEN:", accessToken);

    const response = await admin.messaging().send(message);

    console.log("✅ Successfully sent push notification:", response);
    return response;
  } catch (error) {
    console.log("FULL ERROR:", error);
    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);
    throw error;
  }
};