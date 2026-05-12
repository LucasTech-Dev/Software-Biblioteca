
src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"


  const firebaseConfig = {
    apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",
    authDomain: "bancobiblioteca-24029.firebaseapp.com",
    databaseURL: "https://bancobiblioteca-24029-default-rtdb.firebaseio.com",
    projectId: "bancobiblioteca-24029",
    storageBucket: "bancobiblioteca-24029.firebasestorage.app",
    messagingSenderId: "691451184435",
    appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
  };
 
  // Inicializa apenas uma vez 
  firebase.initializeApp(firebaseConfig);

  console.log("antes");

  firebase.auth()
    .signInWithEmailAndPassword("lucassantanadias2008@gmail.com", "220423")
    .then(response => {
      console.log("sucesso", response);
    })
    .catch(error => {
      console.log("erro", error);
    });

  console.log("depois");
