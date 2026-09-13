// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcPh8Htm7DtIgF5Ozf5oktHOH7IVyLhAU",
  authDomain: "asko-884e7.firebaseapp.com",
  projectId: "asko-884e7",
  storageBucket: "asko-884e7.firebasestorage.app",
  messagingSenderId: "429787629679",
  appId: "1:429787629679:web:8f144af364b481a26ee59a",
  measurementId: "G-BXB85V7HX5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
