import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6-nTwiYN91yAZhn0N3pp70auSNPJ45XU",
  authDomain: "agrifarms-174f9.firebaseapp.com",
  projectId: "agrifarms-174f9",
  storageBucket: "agrifarms-174f9.firebasestorage.app",
  messagingSenderId: "966639409242",
  appId: "1:966639409242:web:c305e1d207344af67ae063",
  measurementId: "G-C86KEQSTPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
