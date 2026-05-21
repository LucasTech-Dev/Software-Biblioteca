// ========================================
// IMPORTS FIREBASE
// ========================================

import { initializeApp }

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import { 

  getAuth,

  signInWithEmailAndPassword

} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  getFirestore

} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";



// ========================================
// CONFIG FIREBASE
// ========================================

const firebaseConfig = {

  apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",

  authDomain: "bancobiblioteca-24029.firebaseapp.com",

  projectId: "bancobiblioteca-24029",

  storageBucket: "bancobiblioteca-24029.firebasestorage.app",

  messagingSenderId: "691451184435",

  appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
};



// ========================================
// INICIALIZAÇÃO
// ========================================

const app = initializeApp(firebaseConfig);



// ========================================
// SERVIÇOS
// ========================================

const auth = getAuth(app);

const db = getFirestore(app);



// ========================================
// LOGIN TESTE
// ========================================

async function login() {

  console.log("antes");


  try {

    const response =

      await signInWithEmailAndPassword(

        auth,

        "lucassantanadias2008@gmail.com",

        "220423"
      );


    console.log("sucesso");

    console.log(response.user);

  }

  catch (error) {

    console.log("erro");

    console.log(error);
  }


  console.log("depois");
}



login();



// ========================================
// EXPORTS
// ========================================

export {

  app,

  auth,

  db
};