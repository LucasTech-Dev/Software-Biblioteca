// ========================================
// IMPORTS
// ========================================

import {

  onAuthStateChanged,
  updatePassword

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";


// ========================================
// ELEMENTOS
// ========================================

const nomeUsuario =
  document.getElementById("nomeUsuario");

const matriculaUsuario =
  document.getElementById("matriculaUsuario");

const turmaUsuario =
  document.getElementById("turmaUsuario");

const historicoDiv =
  document.getElementById("historicoLeituras");

const notificacoesDiv =
  document.getElementById("notificacoes");

const heroTitulo =
  document.querySelector(".hero h1");


// ========================================
// VERIFICAR LOGIN
// ========================================

onAuthStateChanged(auth, async (user) => {

  // NÃO LOGADO
  if (!user) {

    window.location.href = "login.html";
    return;
  }

  try {

    // BUSCAR DADOS
    const docRef =
      doc(db, "usuarios", user.uid);

    const docSnap =
      await getDoc(docRef);


    // EXISTE?
    if (!docSnap.exists()) {

      alert("Usuário não encontrado.");
      return;
    }

    // DADOS
    const dados = docSnap.data();

    console.log(dados);


    // ========================================
    // PREENCHER PERFIL
    // ========================================

    heroTitulo.innerText =
      `Bem-vindo(a), ${dados.nome}`;

    nomeUsuario.innerText =
      dados.nome || "Não definido";

    matriculaUsuario.innerText =
      dados.matricula || "Não definida";

    turmaUsuario.innerText =
      dados.turma || "Não definida";


    // ========================================
    // HISTÓRICO
    // ========================================

    historicoDiv.innerHTML = "";

    if (
      !dados.historico ||
      dados.historico.length === 0
    ) {

      historicoDiv.innerHTML = `
        <div class="item">
          Nenhum livro retirado.
        </div>
      `;
    }

    else {

      dados.historico.forEach((livro) => {

        const div =
          document.createElement("div");

        div.className = "item";

        div.innerHTML = `
          <strong>${livro.nome}</strong>
          • Retirada: ${livro.retirada}
          • Devolução: ${livro.devolucao}
          • Status: ${livro.status}
        `;

        historicoDiv.appendChild(div);
      });
    }


    // ========================================
    // NOTIFICAÇÕES
    // ========================================

    notificacoesDiv.innerHTML = "";

    if (
      !dados.notificacoes ||
      dados.notificacoes.length === 0
    ) {

      notificacoesDiv.innerHTML = `
        <div class="notif">
          Nenhuma notificação.
        </div>
      `;
    }

    else {

      dados.notificacoes.forEach((msg) => {

        const div =
          document.createElement("div");

        div.className = "notif";

        div.innerText = msg;

        notificacoesDiv.appendChild(div);
      });
    }

  }

  catch (error) {

    console.error(error);

    alert("Erro ao carregar perfil.");
  }
});


// ========================================
// ALTERAR SENHA
// ========================================
 
document
  .getElementById("btnAlterarSenha")

  .addEventListener("click", async () => {

    const novaSenha =
      document.getElementById("novaSenha").value;

    // VALIDAÇÃO
    if (novaSenha.length < 6) {

      alert("Senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    try {

      // ALTERAR SENHA
      await updatePassword(
        auth.currentUser,
        novaSenha
      );

      alert("Senha alterada com sucesso!");

      document.getElementById("novaSenha").value = "";

    }

    catch (error) {

      console.error(error);

      alert("Erro ao alterar senha.");
    }
}); 