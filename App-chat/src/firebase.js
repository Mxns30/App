import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdLkCaNXq3C4NK84xvjKYyLAC35MDsRpk",
  authDomain: "chat-test-react-79eac.firebaseapp.com",
  projectId: "chat-test-react-79eac",
  storageBucket: "chat-test-react-79eac.appspot.com",
  messagingSenderId: "549271055281",
  appId: "1:549271055281:web:0f4d07bd04dfda2b9d6b90",
  measurementId: "G-XZZ39E29F0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);