import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";
import UsuarioService from "../firebase/services/UsuarioService.js";
import EmprestimoService from "../firebase/services/EmprestimoService.js";
import ReservaService from "../firebase/services/ReservaService.js";
import ResumoService from "../firebase/services/ResumoService.js";

window.PageGuard?.hold();

// ========================================
let emprestimoSelecionadoResumo = null;
const modalResumoAluno = document.getElementById("modalResumoAluno");
const resumoLivroTitulo = document.getElementById("resumoLivroTitulo");
const txtResumoAluno = document.getElementById("txtResumoAluno");
const btnCancelarResumo = document.getElementById("btnCancelarResumo");
const btnEnviarResumo = document.getElementById("btnEnviarResumo");


let RESERVAS = [];
let EMPRESTIMOS = [];
let filtroAtivo = "todos";
let termoBusca = "";

const loanList = document.getElementById("loan-list");
const btnApagar = document.getElementById("btnApagar");

let perfilCarregado = false;
let emprestimosCarregados = false;
let reservasCarregadas = false;
let paginaLiberada = false;
let carregandoDadosAluno = false;

function liberarPaginaQuandoPronta() {
  if (
    paginaLiberada ||
    !perfilCarregado ||
    !emprestimosCarregados ||
    !reservasCarregadas
  ) {
    return;
  }

  paginaLiberada = true;
  window.PageGuard?.ready();
}

// ========================================
// TEXTOS DO BOTÃO POR FILTRO
// ========================================

const textosBotao = {
  todos:      "🗑️ Apagar Todos",
  reserva:    "🗑️ Apagar Reservas",
  ativo:      "🗑️ Apagar Retiradas",
  atrasado:   "🗑️ Apagar Atrasados",
  devolvido:  "🗑️ Apagar Devolvidos"
};

// ========================================
// CARREGAMENTO DOS DADOS DO ALUNO via Services
// ========================================

async function carregarDadosAluno(uid) {
  if (carregandoDadosAluno) return;
  carregandoDadosAluno = true;
  const btn = document.getElementById('btnAtualizarPerfil');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';
  }

  try {
    const [reservasDoBanco, emprestimosDoBanco] = await Promise.all([
      ReservaService.listarReservasAluno(uid),
      EmprestimoService.listarEmprestimosAluno(uid)
    ]);

    // Filtra localmente o que está visível para o aluno
    RESERVAS = (reservasDoBanco || []).filter(item => item.visivelAluno !== false);
    EMPRESTIMOS = (emprestimosDoBanco || []).filter(item => item.visivelAluno !== false);

    emprestimosCarregados = true;
    reservasCarregadas = true;

    renderizarLista();
    liberarPaginaQuandoPronta();
  } catch (error) {
    console.error("Erro ao carregar dados do aluno nos Services:", error);
    window.showAppMessage?.("Erro ao carregar seus dados.");
    emprestimosCarregados = true;
    reservasCarregadas = true;
    liberarPaginaQuandoPronta();
  } finally {
    carregandoDadosAluno = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '↻ Atualizar Dados';
    }
  }
}

// ========================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "pages/login.html";
    return;
  }

  // ========================================
  // DADOS DO USUÁRIO
  // ========================================
  try {
    const usuario = await UsuarioService.obterUsuario(user.uid);

    document.getElementById("nomeUsuario").innerText =
      usuario?.nome || "Usuário";

    document.getElementById("dadosUsuario").innerText =
      `${usuario?.turma || ""} · Matrícula ${usuario?.matricula || ""}`.trim();

    // ========================================
    // AVATAR
    // ========================================
    const iniciais = (usuario?.nome || "U")
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("");

    document.getElementById("avatarUsuario").innerText =
      iniciais.toUpperCase();

    perfilCarregado = true;

    // Dispara o carregamento unificado via Services
    await carregarDadosAluno(user.uid);
  } catch (error) {
    console.error("Erro ao inicializar perfil do usuário:", error);
    window.showAppMessage?.("Erro ao carregar seus empréstimos.");
    window.PageGuard?.ready();
  }

  // ========================================
  // BOTÃO APAGAR — lógica de clique
  // ========================================
  btnApagar.addEventListener("click", async () => {
    const confirmar = await window.showAppConfirm(
      `Deseja realmente ${btnApagar.textContent.toLowerCase()}?`,
      { confirmText: "Apagar" }
    );

    if (!confirmar) {
      return;
    }

    try {
      if (filtroAtivo === "reserva") {
        const ids = RESERVAS.map(r => r.id);
        await UsuarioService.ocultarReservas(user.uid, ids);
      } else if (filtroAtivo === "todos") {
        const idsReservas = RESERVAS.map(r => r.id);
        const idsEmprestimos = EMPRESTIMOS.map(e => e.id);
        await UsuarioService.ocultarReservas(user.uid, idsReservas);
        await UsuarioService.ocultarEmprestimos(user.uid, idsEmprestimos);
      } else {
        const ids = obterItensDoFiltro().map(e => e.id);
        await UsuarioService.ocultarEmprestimos(user.uid, ids);
      }

      window.showAppMessage?.("Registros apagados da sua visualização.");

      // Recarrega os dados a partir dos services após ocultar
      await carregarDadosAluno(user.uid);
    } catch (error) {
      console.error("Erro ao ocultar registros:", error);
      window.showAppMessage?.("Erro ao apagar registros.");
    }
  });
});

// ========================================

function formatar(timestamp) {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  }
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

// ========================================

function obterStatus(item) {
  if (item.status === "PENDENTE") {
    return "Em análise";
  }

  if (item.status === "EMPRESTADO") {
    if (
      item.prazoEntrega &&
      new Date() > item.prazoEntrega.toDate()
    ) {
      return "Atrasado";
    }
    return "Emprestado";
  }

  if (item.status === "DEVOLVIDO") {
    return "Devolvido";
  }

  return item.status;
}

// ========================================
// Retorna os itens do filtro atual
// ========================================

function obterItensDoFiltro() {
  if (filtroAtivo === "todos") {
    return [
      ...RESERVAS,
      ...EMPRESTIMOS
    ];
  }

  if (filtroAtivo === "reserva") {
    return RESERVAS;
  }

  if (filtroAtivo === "ativo") {
    return EMPRESTIMOS.filter(item =>
      item.status === "EMPRESTADO"
    );
  }

  if (filtroAtivo === "atrasado") {
    return EMPRESTIMOS.filter(item => {
      if (item.status !== "EMPRESTADO") {
        return false;
      }
      if (!item.prazoEntrega) {
        return false;
      }
      return new Date() > item.prazoEntrega.toDate();
    });
  }

  if (filtroAtivo === "devolvido") {
    return EMPRESTIMOS.filter(item =>
      item.status === "DEVOLVIDO"
    );
  }

  return [];
}

// ========================================

function atualizarBotaoApagar() {
  btnApagar.textContent =
    textosBotao[filtroAtivo] || "🗑️ Apagar";

  const itens = obterItensDoFiltro();

  btnApagar.style.display =
    itens.length > 0
      ? "inline-flex"
      : "none";
}

// ========================================

function renderizarLista() {
  const lista = document.getElementById("loan-list");
  let origem = [];

  if (filtroAtivo === "todos") {
    origem = [
      ...RESERVAS,
      ...EMPRESTIMOS
    ];
  } else if (filtroAtivo === "reserva") {
    origem = RESERVAS;
  } else if (filtroAtivo === "ativo") {
    origem = EMPRESTIMOS.filter(item =>
      item.status === "EMPRESTADO"
    );
  } else if (filtroAtivo === "atrasado") {
    origem = EMPRESTIMOS.filter(item => {
      if (item.status !== "EMPRESTADO") {
        return false;
      }
      if (!item.prazoEntrega) {
        return false;
      }
      return new Date() > item.prazoEntrega.toDate();
    });
  } else if (filtroAtivo === "devolvido") {
    origem = EMPRESTIMOS.filter(item =>
      item.status === "DEVOLVIDO"
    );
  }

  const itens = origem.filter(item => {
    return termoBusca === ""
      || (item.titulo || item.tituloLivro)
          ?.toLowerCase()
          .includes(termoBusca);
  });

  atualizarBotaoApagar();

  lista.innerHTML = ""; // Limpa a lista antes de renderizar

  if (!itens.length) {
    lista.innerHTML = `
      <div class="empty">
        <span class="empty-icon">
          📚
        </span>
        Nenhum item encontrado.
      </div>
    `;
    return;
  }

  // Utiliza forEach ao invés de map para podermos anexar o evento de clique na div
  itens.forEach(item => {
    const isDevolvido = item.status === "DEVOLVIDO";
    const statusTexto = obterStatus(item);

    const badgeClass =
      isDevolvido
        ? "badge-returned"
        : item.status === "PENDENTE"
          ? "badge-pending"
          : statusTexto === "Atrasado"
            ? "badge-delayed"
            : "badge-active";

    const bookClass =
      isDevolvido
        ? "book-green"
        : item.status === "PENDENTE"
          ? "book-amber"
          : statusTexto === "Atrasado"
            ? "book-red"
            : "book-blue";

    const div = document.createElement("div");
    div.className = "loan-item";

    if (isDevolvido) {
      div.style.cursor = "pointer";
    }

    div.innerHTML = `
      <div class="book-icon ${bookClass}">
        📖
      </div>
      <div class="loan-info">
        <div class="loan-title">
          ${item.titulo || item.tituloLivro}
        </div>
        <div class="loan-author">
          ${item.autor || "Autor não informado"}
        </div>
        <div class="loan-dates">
          <div class="date-block">
            Status
            <strong>
              ${statusTexto}
            </strong>
          </div>
          ${item.dataSolicitacao ? `
          <div class="date-block">
            Criado em
            <strong>
              ${formatar(item.dataSolicitacao)}
            </strong>
          </div>
          ` : ""}
          ${item.prazoEntrega ? `
          <div class="date-block">
            Devolução
            <strong>
              ${formatar(item.prazoEntrega)}
            </strong>
          </div>
          ` : ""}
        </div>
        ${isDevolvido ? `<small style="color: #2563eb; margin-top: 4px; display: block;">✍️ Clique para deixar seu resumo e ganhar 1 moeda!</small>` : ""}
      </div>
      <div class="loan-right">
        <span class="badge ${badgeClass}">
          ${statusTexto}
        </span>
      </div>
    `;

    // Anexa o evento de clique no card, abrindo o modal de resumo
    if (isDevolvido) {
      div.addEventListener("click", () => abrirModalEnviarResumoAluno(item));
    }

    lista.appendChild(div);
  });
}

// ========================================
// FILTROS
// ========================================

document
  .querySelectorAll(".chip")
  .forEach(btn => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach(c =>
          c.classList.remove("active")
        );

      btn.classList.add("active");
      filtroAtivo = btn.dataset.filter;
      renderizarLista();
    });
  });

// ========================================
// BUSCA
// ========================================

document
  .getElementById("searchInput")
  .addEventListener("input", e => {
    termoBusca = e.target.value
      .toLowerCase()
      .trim();

    renderizarLista();
  });

// ========================================
// LÓGICA DO MODAL DE RESUMO
// ========================================

async function abrirModalEnviarResumoAluno(emprestimo) {
  emprestimoSelecionadoResumo = emprestimo;

  const resumoExistente = await ResumoService.obterResumoPorEmprestimo(emprestimo.id);

  if (resumoExistente) {
    if (resumoExistente.status === "aguardando") {
      window.showAppMessage?.("Seu resumo já foi enviado e está aguardando a aprovação do professor! ⏳");
    } else if (resumoExistente.status === "aprovado") {
      window.showAppMessage?.("Seu resumo já foi aprovado e a moeda foi creditada! 🎉");
    }
    return;
  }

  resumoLivroTitulo.textContent = emprestimo.titulo || emprestimo.tituloLivro;
  txtResumoAluno.value = "";
  modalResumoAluno.classList.add("show");
}

btnCancelarResumo?.addEventListener("click", () => {
  modalResumoAluno.classList.remove("show");
});

btnEnviarResumo?.addEventListener("click", async () => {
  const texto = txtResumoAluno.value.trim();
  if (!texto) {
    window.showAppMessage?.("Escreva o resumo antes de enviar.");
    return;
  }

  const user = auth.currentUser;
  const nomeExibicao = document.getElementById("nomeUsuario")?.innerText || user.displayName || "Aluno";

  try {
    await ResumoService.enviarResumo({
      emprestimoId: emprestimoSelecionadoResumo.id,
      alunoId: user.uid,
      alunoNome: nomeExibicao,
      tituloLivro: emprestimoSelecionadoResumo.titulo || emprestimoSelecionadoResumo.tituloLivro,
      resumo: texto
    });

    window.showAppMessage?.("Resumo enviado com sucesso!");
    modalResumoAluno.classList.remove("show");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao enviar o resumo.");
  }
});