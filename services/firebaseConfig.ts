import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyBYdQzqf-OgNLtUm61hzyIuneJmGnYgTDA",
  authDomain: "kindersafe-add79.firebaseapp.com",
  projectId: "kindersafe-add79",
  storageBucket: "kindersafe-add79.firebasestorage.app",
  messagingSenderId: "1035376127448",
  appId: "1:1035376127448:web:1ceebc75b202f89b8756ad",
  measurementId: "G-PD39PHM2H8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// --- O'ZGARISH SHU YERDA ---
export const googleProvider = new GoogleAuthProvider();

// Bu qator har safar Google akkaunt tanlash oynasini chiqarishga majburlaydi
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
// ---------------------------

export const db = getFirestore(app);
auth.useDeviceLanguage();