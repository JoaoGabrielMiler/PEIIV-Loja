// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9TiPQK4_pGjvwWSX2nG3vrI-OUJhBURY",
  authDomain: "db-pwa-univag.firebaseapp.com",
  projectId: "db-pwa-univag",
  storageBucket: "db-pwa-univag.appspot.com",
  messagingSenderId: "390579796961",
  appId: "1:390579796961:web:e44ef3ef4c3edcc60cf0a0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Exporta banco e storage para usar em outros arquivos
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Autenticação anônima
const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("Autenticado anonimamente"))
  .catch((error) => console.error("Erro na autenticação:", error)); 
