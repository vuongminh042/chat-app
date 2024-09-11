import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: "reactchat-2968d.firebaseapp.com",
    projectId: "reactchat-2968d",
    storageBucket: "reactchat-2968d.appspot.com",
    messagingSenderId: "668041327447",
    appId: "1:668041327447:web:de287226b93da4c5c70412"
};



const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()