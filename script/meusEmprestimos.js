import {

  onAuthStateChanged

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth }

from "../firebase/auth.js";

import { db }

from "../firebase/firestore.js";

import {

  listarEmprestimosUsuario

}

from "../firebase/services/emprestimosService.js";


// ========================================

const loanList =
  document.getElementById(
    "loan-list"
  );

const statActive =
  document.getElementById(
    "s-active"
  );

const statDelayed =
  document.getElementById(
    "s-delayed"
  );

const statReturned =
  document.getElementById(
    "s-returned"
  );


// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const usuarioRef = doc(
    db,
    "usuarios",
    user.uid
  );

  const usuarioSnap =
    await getDoc(usuarioRef);

  const usuario =
    usuarioSnap.data();

  document.querySelector(
    ".header-name"
  ).innerText =
    usuario.nome;

  document.querySelector(
    ".header-sub"
  ).innerText =
    `${usuario.turma} · Matrícula ${usuario.matricula}`;

  const emprestimos =
    await listarEmprestimosUsuario(
      user.uid
    );

  render(emprestimos);
});


// ========================================

function render(lista) {

  loanList.innerHTML = "";

  let ativos = 0;

  let atrasados = 0;

  let devolvidos = 0;

  lista.forEach(emp => {

    let status =
      "Em andamento";

    let badge =
      "badge-active";

    const hoje =
      new Date();

    const prazo =
      emp.prazoEntrega.toDate();

    if (hoje > prazo) {

      status =
        "Atrasado";

      badge =
        "badge-delayed";

      atrasados++;
    }

    else {

      ativos++;
    }

    loanList.innerHTML += `

      <div class="loan-item">

        <div class="book-icon book-blue">
          📘
        </div>

        <div class="loan-info">

          <div class="loan-title">

            ${emp.tituloLivro}

          </div>

          <div class="loan-author">

            Matrícula:
            ${emp.matricula}

          </div>

          <div class="loan-dates">

            <div class="date-block">

              Retirada

              <strong>

                ${formatar(
                  emp.retiradoEm
                )}

              </strong>

            </div>

            <div class="date-block">

              Prazo

              <strong>

                ${formatar(
                  emp.prazoEntrega
                )}

              </strong>

            </div>

          </div>

        </div>

        <div class="loan-right">

          <span class="badge ${badge}">

            ${status}

          </span>

        </div>

      </div>
    `;
  });

  statActive.innerText =
    ativos;

  statDelayed.innerText =
    atrasados;

  statReturned.innerText =
    devolvidos;
}


// ========================================

function formatar(timestamp) {

  return timestamp
    .toDate()
    .toLocaleDateString("pt-BR");
}