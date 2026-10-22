import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";

import { app, auth, db } from "../../firebaseConfig";

// Public key from Firebase console → Project settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const TOKEN_KEY = "pushToken";

export class PushError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "unsupported" | "denied" | "notConfigured"
  }
}

/**
 * "unsupported" — browser can't do web push (on iPhone: only once the app is
 *                 added to the home screen, iOS 16.4+)
 * "denied"      — the user blocked notifications in the browser settings
 * "enabled"     — this device is registered
 * "available"   — can be turned on
 */
export async function getPushStatus() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && readToken() ? "enabled" : "available";
}

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function registerWorker() {
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/firebase-cloud-messaging-push-scope",
  });
}

/** Asks permission (must run from a tap) and stores this device's token on the user. */
export async function enablePush() {
  if ((await getPushStatus()) === "unsupported") throw new PushError("unsupported");
  if (!VAPID_KEY) throw new PushError("notConfigured");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new PushError("denied");

  const token = await getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await registerWorker(),
  });

  await updateDoc(doc(db, "users", auth.currentUser.uid), { fcmTokens: arrayUnion(token) });
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Push still works; the toggle just won't remember this device
  }
}

export async function disablePush() {
  const token = readToken();
  if (token && auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { fcmTokens: arrayRemove(token) });
  }
  try {
    await deleteToken(getMessaging(app));
  } catch (err) {
    console.error(err);
  }
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clean up
  }
}

/**
 * Tokens rotate; refresh this device's token on startup when push is on.
 * Safe to call on every login — arrayUnion ignores an unchanged token.
 */
export async function refreshPushToken() {
  if ((await getPushStatus()) !== "enabled" || !VAPID_KEY || !auth.currentUser) return;

  const previous = readToken();
  const token = await getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await registerWorker(),
  });
  if (token === previous) return;

  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    fcmTokens: arrayUnion(token),
  });
  if (previous) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { fcmTokens: arrayRemove(previous) });
  }
  localStorage.setItem(TOKEN_KEY, token);
}
