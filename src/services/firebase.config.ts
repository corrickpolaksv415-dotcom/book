
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPnNnhBbsfyvbC0yObBROzzpd_a9vjyt0",
  authDomain: "book-6e238.firebaseapp.com",
  projectId: "book-6e238",
  storageBucket: "book-6e238.firebasestorage.app",
  messagingSenderId: "503657321379",
  appId: "1:503657321379:web:1a60dab366d7f05ccd0016",
  measurementId: "G-VZJWQ8V05J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
