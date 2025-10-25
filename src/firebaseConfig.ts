// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBa8r_kxIdDIxS_shP_MD7Y4BeoxtdBrc",
  authDomain: "pwa-loja-pei.firebaseapp.com",
  projectId: "pwa-loja-pei",
  storageBucket: "pwa-loja-pei.appspot.com",
  messagingSenderId: "872935416267",
  appId: "1:872935416267:web:f7597444e0f2f5cd88164e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta banco e storage para usar em outros arquivos
export const db = getFirestore(app);
export const storage = getStorage(app);
