import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQcWtAoOY0JyEQfIjHhb1VkivU-OFQfsE",
  authDomain: "herstel-app.firebaseapp.com",
  projectId: "herstel-app",
  storageBucket: "herstel-app.firebasestorage.app",
  messagingSenderId: "1084797461030",
  appId: "1:1084797461030:web:0225a7ae7499d457b03ce7",
  measurementId: "G-2RE0B4FJN2"
};

// Initialiseer Firebase (voorkom dubbele initialisatie)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

// Stel persistence in voor web-omgevingen zonder de 'window' error direct te triggeren
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence);
}

const db = getFirestore(app);

export { auth, db };