// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZtqtnAs7R2Zfevn-1siqmqYAKgVNu-P0",
  authDomain: "bwclone-8dcc0.firebaseapp.com",
  projectId: "bwclone-8dcc0",
  storageBucket: "bwclone-8dcc0.firebasestorage.app",
  messagingSenderId: "522582375123",
  appId: "1:522582375123:web:ee9cce9561a936f4ef3226",
  measurementId: "G-B7CLVKDTBC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
