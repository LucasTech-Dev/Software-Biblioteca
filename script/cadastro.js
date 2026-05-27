// ========================================
// IMPORTS
// ========================================

import {
  createUserWithEmailAndPassword
}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  setDoc,
  serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";


// ========================================
// ROLE
// ========================================

let roleSelecionada = "";

window.selectRole = function(role) {

  roleSelecionada = role;

  document
    .querySelectorAll(".role-opt")
    .forEach(btn => btn.classList.remove("active"));

  document
    .getElementById(`opt-${role}`)
    .classList.add("active");
};


// ========================================
// CADASTRO
// ========================================

window.handleCadastro = async function() {

  // INPUTS
  const nome = document.getElementById("inp-nome").value.trim();

  const matricula = document.getElementById("inp-id").value.trim();

  const turma = document.getElementById("inp-turma").value;

  const email = document.getElementById("inp-email").value.trim();

  const senha = document.getElementById("inp-senha").value;

  const confirma = document.getElementById("inp-confirma").value;

  const feedback = document.getElementById("msg-feedback");


  // RESET MSG
  feedback.innerText = "";


  // VALIDAÇÕES
  if (!roleSelecionada) {

    feedback.innerText = "Selecione um perfil.";
    return;
  }

  if (!nome || !matricula || !email || !senha) {

    feedback.innerText = "Preencha todos os campos.";
    return;
  }

  if (senha.length < 6) {

    feedback.innerText = "Senha precisa ter no mínimo 6 caracteres.";
    return;
  }

  if (senha !== confirma) {

    feedback.innerText = "As senhas não coincidem.";
    return;
  }


  try {

    // ========================================
    // AUTHENTICATION
    // ========================================

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );

    const user = userCredential.user;


    // ========================================
    // FIRESTORE
    // ========================================

   await setDoc(doc(db, "usuarios", user.uid), {

  uid: user.uid,

  nome: nome,

  email: email,

  matricula: matricula,

  turma: turma || "Não definida",

  perfil: roleSelecionada,

  livrosPegos: 0,

  reservas: 0,

  multas: 0,

  historico: [],

  notificacoes: [],

  criadoEm: serverTimestamp()
});


    // SUCESSO
    feedback.innerText = "Conta criada com sucesso!";

    console.log("Usuário criado:", user);


    // REDIRECT
    setTimeout(() => {

      window.location.href = "login.html";

    }, 1500);

  }

  catch (error) {

    console.error(error);

    // ERROS FIREBASE
    switch (error.code) {

      case "auth/email-already-in-use":
        feedback.innerText = "Este email já está cadastrado.";
        break;

      case "auth/invalid-email":
        feedback.innerText = "Email inválido.";
        break;

      case "auth/weak-password":
        feedback.innerText = "Senha muito fraca.";
        break;

      default:
        feedback.innerText = "Erro ao criar conta.";
    }
  }
};


// ========================================
// SENHA
// ========================================

window.avaliarSenha = function(senha) {

  const segs = [

    document.getElementById("seg1"),
    document.getElementById("seg2"),
    document.getElementById("seg3"),
    document.getElementById("seg4")

  ];

  const label = document.getElementById("lbl-forca");

  segs.forEach(seg => seg.style.background = "#ddd");

  let forca = 0;

  if (senha.length >= 6) forca++;
  if (/[A-Z]/.test(senha)) forca++;
  if (/[0-9]/.test(senha)) forca++;
  if (/[^A-Za-z0-9]/.test(senha)) forca++;

  for (let i = 0; i < forca; i++) {

    segs[i].style.background = "#22c55e";
  }

  const niveis = [
    "",
    "Fraca",
    "Média",
    "Boa",
    "Forte"
  ];

  label.innerText = niveis[forca];
};