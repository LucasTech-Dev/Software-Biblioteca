// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",
  authDomain: "bancobiblioteca-24029.firebaseapp.com",
  databaseURL: "https://bancobiblioteca-24029-default-rtdb.firebaseio.com",
  projectId: "bancobiblioteca-24029",
  storageBucket: "bancobiblioteca-24029.firebasestorage.app",
  messagingSenderId: "691451184435",
  appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
};

const src= src("bancobiblioteca-24029.firebaseapp-compat.com")
const auth= src("bancobiblioteca-24029.firebaseauth-compat.com")
const app = initializeApp(firebaseConfig);

firebaseConfig.initializeApp(firebaseConfig)

console.log("antes")
firebase.auth().singInWithEmaillAndPassword("lucas@123", "123").then(Response=>{
  console.log("sucesso", Response)

}).catch(error=>{
  console.log("erro", error)

})
console.log("depois")

