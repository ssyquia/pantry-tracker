import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAzcldRR_NE5KbQEXNkzCsY3iDydwBjF6k",
  authDomain: "inventory-management-71101.firebaseapp.com",
  projectId: "inventory-management-71101",
  storageBucket: "inventory-management-71101.appspot.com",
  messagingSenderId: "701175154050",
  appId: "1:701175154050:web:e7bdd403bfff918830fb9b",
  measurementId: "G-HCFFP7W3HX"
};

const app = initializeApp(firebaseConfig);
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
const firestore = getFirestore(app);
export { app, firebaseConfig, firestore, analytics };