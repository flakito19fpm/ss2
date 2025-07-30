// firebaseConfig.js
// ¡ATENCIÓN! Reemplaza estos valores con la configuración REAL de tu proyecto de Firebase.
// No compartas esta información sensible en un repositorio público.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics"; // Importa getAnalytics

const firebaseConfig = {
  apiKey: "AIzaSyBi1jmx1dyF7FR1Ezr2cZIckugaSVS09Pk",
  authDomain: "kaawa-af5d0.firebaseapp.com",
  projectId: "kaawa-af5d0",
  storageBucket: "kaawa-af5d0.firebasestorage.app",
  messagingSenderId: "3980742207",
  appId: "1:3980742207:web:5945a89230987d33a1b28a",
  measurementId: "G-93NJ8Y7296"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que vas a usar
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // Inicializa y exporta analytics

export { app, db, auth, analytics }; // Exporta analytics también