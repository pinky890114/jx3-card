import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHN8_5tK3Bdtg9MuWBAU5yTQ8q45bInLk",
  authDomain: "jx3-card.firebaseapp.com",
  projectId: "jx3-card",
  storageBucket: "jx3-card.firebasestorage.app",
  messagingSenderId: "274070165773",
  appId: "1:274070165773:web:af6ac8b3374dee147bb844"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

