/* global importScripts, firebase */
// Receives FCM pushes while the app is closed or in the background.
// Registered by src/services/notifications/push.js under its own scope, so it
// lives alongside the PWA service worker without replacing it. Notifications
// with a `notification` payload are displayed by the SDK, and a click opens
// the link the Cloud Function sets in webpush.fcmOptions.
//
// Keep the version in step with the `firebase` package.
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB-xy9LsTWq8J1kO4VD1xrLaCHHYnwUXqU",
  authDomain: "guaiaca-cd777.firebaseapp.com",
  projectId: "guaiaca-cd777",
  storageBucket: "guaiaca-cd777.firebasestorage.app",
  messagingSenderId: "471165652507",
  appId: "1:471165652507:web:09d9a969377ab7a3a632be",
});

firebase.messaging();
