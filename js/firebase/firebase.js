import { initializeApp } from "firebase/app";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCLESyw1CV2JA4_baSZ9C-_k8oIvxdE6ao",
  authDomain: "pulse-79cea.firebaseapp.com",
  projectId: "pulse-79cea",
  storageBucket: "pulse-79cea.firebasestorage.app",
  messagingSenderId: "121836620744",
  appId: "1:121836620744:web:0f7547021b6757d6b7cefd",
};


/* =========================================================
   FIREBASE APP
========================================================= */

export const firebaseApp =
  initializeApp(
    firebaseConfig
  );