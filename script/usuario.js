import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";

import {
  ocultarEmprestimos,
  limparEmprestimosOcultos
} from "../firebase/services/usuariosService.js";


// ========================================
// ELEMENTOS
// ========================================

const nomeUsuario       = document.getElementById("nomeUsuario");
const matriculaUsuario  = document.getElementById("matriculaUsuario");
const turmaUsuario      = document.getElementById("turmaUsuario");
const historicoDiv      = document.getElementById("historicoLeituras");
const notificacoesDiv   = document.getElementById("notificacoes");
const heroTitulo        = document.getElementById("heroNome");


// ========================================
// ESTADO
// ========================================

let todosEmprestimos = [];


// ========================================
// RENDERIZAR HISTÓRICO
// ========================================

function renderizarHistorico(emprestimos, ocultos) {

  historicoDiv.innerHTML = "";

  const visiveis = emprestimos.filter(
    emp => !ocultos.includes(emp.id)
  );

  if (visiveis.length === 0) {

    historicoDiv.innerHTML = `
      <div class="item">
        Nenhum empréstimo encontrado.
      </div>
    `;

    return;
  }

  visiveis.forEach((emp) => {

    const retirada = emp.retiradoEm?.toDate
      ? emp.retiradoEm.toDate().toLocaleDateString("pt-BR")
      : "-";

    const devolucao = emp.prazoEntrega?.toDate
      ? emp.prazoEntrega.toDate().toLocaleDateString("pt-BR")
      : "-";

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <strong>${emp.tituloLivro}</strong>
      <br>
      Retirada: ${retirada}
      <br>
      Devolução: ${devolucao}
      <br>
      Status: ${emp.status}
    `;

    historicoDiv.appendChild(div);
  });
}


// ========================================
// VERIFICAR LOGIN
// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const docRef  = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Usuário não encontrado.");
      return;
    }

    const dados = docSnap.data();


    // ========================================
    // PREENCHER PERFIL
    // ========================================

    heroTitulo.innerText        = `Bem-vindo(a), ${dados.nome}`;
    nomeUsuario.innerText       = dados.nome      || "Não definido";
    matriculaUsuario.innerText  = dados.matricula || "Não definida";
    turmaUsuario.innerText      = dados.turma     || "Não definida";


    // ========================================
    // BUSCAR EMPRÉSTIMOS
    // ========================================

    const q = query(
      collection(db, "emprestimos"),
      where("usuarioId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    todosEmprestimos = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    const ocultos = dados.emprestimosOcultos || [];

    renderizarHistorico(todosEmprestimos, ocultos);


    // ========================================
    // NOTIFICAÇÕES
    // ========================================

    notificacoesDiv.innerHTML = "";

    if (!dados.notificacoes || dados.notificacoes.length === 0) {

      notificacoesDiv.innerHTML = `
        <div class="notif">
          Nenhuma notificação.
        </div>
      `;

    } else {

      dados.notificacoes.forEach((msg) => {

        const div = document.createElement("div");
        div.className = "notif";
        div.innerText = msg;

        notificacoesDiv.appendChild(div);
      });
    }


    // ========================================
    // LIMPAR HISTÓRICO
    // ========================================

    document.getElementById("btnApagarHistorico")
      .addEventListener("click", async () => {

        if (!confirm("Deseja ocultar todo o histórico?")) return;

        const ids = todosEmprestimos.map(emp => emp.id);

        await ocultarEmprestimos(ids);

        renderizarHistorico(todosEmprestimos, ids);
      });


    // ========================================
    // RESTAURAR HISTÓRICO
    // ========================================

    document.getElementById("btnRestaurarHistorico")
      .addEventListener("click", async () => {

        await limparEmprestimosOcultos();

        renderizarHistorico(todosEmprestimos, []);
      });

  } catch (error) {

    console.error(error);
    alert("Erro ao carregar perfil.");
  }
});


// ========================================
// ALTERAR SENHA
// ========================================

document.getElementById("btnAlterarSenha")
  .addEventListener("click", async () => {

    const novaSenha =
      document.getElementById("novaSenha").value;

    if (novaSenha.length < 6) {
      alert("Senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    try {

      await updatePassword(auth.currentUser, novaSenha);
      alert("Senha alterada com sucesso!");
      document.getElementById("novaSenha").value = "";

    } catch (error) {

      console.error(error);
      alert("Erro ao alterar senha.");
    }
  });