import { initializeApp }

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";


// CONFIG
const firebaseConfig = {

  apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",

  authDomain: "bancobiblioteca-24029.firebaseapp.com",

  projectId: "bancobiblioteca-24029",

  storageBucket: "bancobiblioteca-24029.firebasestorage.app",

  messagingSenderId: "691451184435",

  appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
};


// APP
const app = initializeApp(firebaseConfig);


// EXPORT
export { app };