import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // For login/signup
import { getFirestore } from "firebase/firestore"; // For the database

const firebaseConfig = {
  apiKey: "AIzaSyAqgQwir153d0msyXZmxqM1fR4jHnDZLe8",
  authDomain: "straymandufb.firebaseapp.com",
  projectId: "straymandufb",
  storageBucket: "straymandufb.firebasestorage.app",
  messagingSenderId: "329098568444",
  appId: "1:329098568444:web:2c8539008d4c34efb5ed79"
};

const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;