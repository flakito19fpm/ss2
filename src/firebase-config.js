// ¡Ojo! Aquí es donde irán tus credenciales de Firebase. 
// No las compartas con nadie, a menos que quieras que alguien más se haga cargo de tu "brillante" sistema de soporte.
// Reemplaza los valores con la configuración de tu proyecto de Firebase.
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from 'firebase/analytics'; // Si quieres analytics, descomenta esto.
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID" // Si usas analytics
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Si quieres analytics
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };