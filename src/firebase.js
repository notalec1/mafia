// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDgkfy9Y8SvL0rjCtGzLgsSqTp6mZnankY",
  authDomain: "mafiaonline-43409.firebaseapp.com",
  databaseURL: "https://mafiaonline-43409-default-rtdb.firebaseio.com",
  projectId: "mafiaonline-43409",
  storageBucket: "mafiaonline-43409.firebasestorage.app",
  messagingSenderId: "791522740316",
  appId: "1:791522740316:web:519cc375a49db9e54fbe99",
  measurementId: "G-BWV6S3PPX5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);