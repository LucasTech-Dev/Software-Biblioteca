import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCUisepO_NJCm2mZHWQczgVB5AplDJa0LA",
  authDomain: "biblioteca-riachuelo.firebaseapp.com",
  projectId: "biblioteca-riachuelo",
  storageBucket: "biblioteca-riachuelo.firebasestorage.app",
  messagingSenderId: "375143207365",
  appId: "1:375143207365:web:89548892164c039785bbac"
};

// APP 
const app = initializeApp(firebaseConfig);

// EXPORT 
export { app };