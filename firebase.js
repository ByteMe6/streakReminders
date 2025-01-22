// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBySS4zzP9t-Zk0w8dHfNijqO77GLiXSV8",
  authDomain: "streakreminder-bdd7f.firebaseapp.com",
  databaseURL: "https://streakreminder-bdd7f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "streakreminder-bdd7f",
  storageBucket: "streakreminder-bdd7f.firebasestorage.app",
  messagingSenderId: "812423799745",
  appId: "1:812423799745:web:a8d4043e2991317055c540",
  measurementId: "G-V1E830XL20"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);