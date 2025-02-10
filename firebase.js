// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
// import { getDatabase, ref, set, get } from 'firebase/database';
// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and Realtime Database
const auth = getAuth();
const database = getDatabase();

// Export functions for use in other files
export { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, ref, set, get, signOut, remove, onValue };