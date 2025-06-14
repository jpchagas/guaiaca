// Replace with your actual Firebase config values from the Firebase Console
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBuyUUYuQaV37wBOfQVm2M0Tnls-6QxnNA",
  authDomain: "guaiaca-3404b.firebaseapp.com",
  projectId: "guaiaca-3404b",
  storageBucket: "guaiaca-3404b.firebasestorage.app",
  messagingSenderId: "273753511371",
  appId: "1:273753511371:web:040fd219f6402c57ca124e",
  measurementId: "G-55WHT5QKJY"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
