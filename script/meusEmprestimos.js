import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } 
from "../firebase/auth.js";

import { db } 
from "../firebase/firestore.js";

import { listarEmprestimosUsuario } 
from "../firebase/services/emprestimosService.js";

// ========================================

const loanList =
  document.getElementById("loan-list");

const statActive =
  document.getElementById("s-active");

const statDelayed =
  document.getElementById("s-delayed");

const statReservas =
  document.getElementById("s-reservas");

// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // ========================================
  // DADOS DO USUÁRIO
  // ========================================

  const usuarioRef = doc(db, "usuarios", user.uid);
  const usuarioSnap = await getDoc(usuarioRef);
  const usuario = usuarioSnap.data();

  document.getElementById("nomeUsuario").innerText = usuario.nome;
  document.getElementById("dadosUsuario").innerText =
    `${usuario.turma} · Matrícula ${usuario.matricula}`;

  // ========================================
  // AVATAR
  // ========================================

  const iniciais = usuario.nome
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("");

  document.getElementById("avatarUsuario").innerText =
    iniciais.toUpperCase();

  // ========================================
  // MOVIMENTAÇÕES
  // ========================================

// export async function listarEmprestimosUsuario(uid) {

//   const q = query(
//     collection(db, "emprestimos"),
//     where("usuarioId", "==", uid)
//   );

//   const snapshot =
//     await getDocs(q);

//   const lista = snapshot.docs.map(doc => ({

//     id: doc.id,

//     ...doc.data()

//   }));

//   lista.sort((a, b) => {

//     const dataA =
//       a.criadoEm?.seconds || 0;

//     const dataB =
//       b.criadoEm?.seconds || 0;

//     return dataB - dataA;

//   });

//   return lista;
// }




const lista =
  await listarEmprestimosUsuario(user.uid);

render(lista);

});

// ========================================

function render(lista) {
  loanList.innerHTML = "";

  let ativos = 0;
  let atrasados = 0;
  let reservas = 0;

  if (lista.length === 0) {
    loanList.innerHTML = `
      <div class="empty">
        <span class="empty-icon">📚</span>
        Nenhuma movimentação encontrada.
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    let statusTexto = "";
    let badge = "";
    let iconClass = "book-blue";

    // ========================================
    // RESERVA
    // ========================================
    if (item.tipo === "reserva") {
      statusTexto = "Reservado";
      badge = "badge-active";
      reservas++;
    }

    // ========================================
    // EMPRÉSTIMO
    // ========================================
    if (item.tipo === "emprestimo") {
      const hoje = new Date();
      const prazo = item.prazoEntrega.toDate();

      if (hoje > prazo) {
        statusTexto = "Atrasado";
        badge = "badge-delayed";
        atrasados++;
        iconClass = "book-red";
      } else {
        statusTexto = "Em andamento";
        badge = "badge-active";
        ativos++;
      }
    }

    loanList.innerHTML += `
      <div class="loan-item">
        <div class="book-icon ${iconClass}">📘</div>
        <div class="loan-info">
          <div class="loan-title">${item.tituloLivro}</div>
          <div class="loan-author">${item.autorLivro || "Autor não informado"}</div>
          <div class="loan-dates">
            <div class="date-block">
              Tipo <strong>${item.tipo}</strong>
            </div>
            <div class="date-block">
              Criado em <strong>${formatar(item.criadoEm)}</strong>
            </div>
          </div>
        </div>
        <div class="loan-right">
          <span class="badge ${badge}">${statusTexto}</span>
        </div>
      </div>
    `;
  });
 
  statActive.innerText = ativos;
  statDelayed.innerText = atrasados;
  statReservas.innerText = reservas;
}

// ========================================

function formatar(timestamp) {
  if (!timestamp) return "-";
  return timestamp.toDate().toLocaleDateString("pt-BR");
}