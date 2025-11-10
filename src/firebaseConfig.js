// ===== src/firebaseConfig.js =====
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyB-xy9LsTWq8J1kO4VD1xrLaCHHYnwUXqU",
  authDomain: "guaiaca-cd777.firebaseapp.com",
  projectId: "guaiaca-cd777",
  storageBucket: "guaiaca-cd777.firebasestorage.app",
  messagingSenderId: "471165652507",
  appId: "1:471165652507:web:09d9a969377ab7a3a632be"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
