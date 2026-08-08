import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCT-94LkpAIxT6yrvprmXFsmghYEgesWZo",
  authDomain: "mounjaro-tracker-8301f.firebaseapp.com",
  projectId: "mounjaro-tracker-8301f",
  storageBucket: "mounjaro-tracker-8301f.firebasestorage.app",
  messagingSenderId: "25796433248",
  appId: "1:25796433248:web:d1bfd0690cb798422ffa05"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
