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

  try {
    const usuario = await UsuarioService.obterUsuario(user.uid);

    document.getElementById("nomeUsuario").innerText =
      usuario?.nome || "Usuário";

    document.getElementById("dadosUsuario").innerText =
      `${usuario?.turma || ""} · Matrícula ${usuario?.matricula || ""}`.trim();

    const iniciais = (usuario?.nome || "U")
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("");

    document.getElementById("avatarUsuario").innerText =
      iniciais.toUpperCase();

    perfilCarregado = true;

    await carregarDadosAluno(user.uid);
  } catch (error) {
    console.error("Erro ao inicializar perfil do usuário:", error);
    window.showAppMessage?.("Erro ao carregar seus empréstimos.");
    window.PageGuard?.ready();
  }

  btnApagar.addEventListener("click", async () => {
    // Usando confirm nativo para evitar falha (Crash) silenciosa na página
    const confirmar = window.confirm(`Deseja realmente ${btnApagar.textContent.toLowerCase()}?`);

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

      alert("Registros apagados da sua visualização.");
      await carregarDadosAluno(user.uid);
    } catch (error) {
      console.error("Erro ao ocultar registros:", error);
      alert("Erro ao apagar registros.");
    }
  });
});

// ========================================

// Nova função segura para lidar com diferentes formatos de data e evitar "Invalid Date"
function parseDateSeguro(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === "function") {
    return valor.toDate();
  }
  
  const data = new Date(valor);
  if (isNaN(data.getTime())) {
    return null;
  }
  
  return data;
}

function formatar(timestamp) {
  const data = parseDateSeguro(timestamp);
  return data ? data.toLocaleDateString("pt-BR") : "-";
}

// ========================================

function obterStatus(item) {
  if (item.status === "PENDENTE") {
    return "Em análise";
  }

  if (item.status === "EMPRESTADO") {
    if (item.prazoEntrega) {
      const dataPrazo = parseDateSeguro(item.prazoEntrega);
      if (dataPrazo && new Date() > dataPrazo) {
        return "Atrasado";
      }
    }
    return "Emprestado";
  }

  if (item.status === "DEVOLVIDO") {
    return "Devolvido";
  }

  return item.status;
}

// ========================================

function obterItensDoFiltro() {
  if (filtroAtivo === "todos") {
    return [...RESERVAS, ...EMPRESTIMOS];
  }

  if (filtroAtivo === "reserva") {
    return RESERVAS;
  }

  if (filtroAtivo === "ativo") {
    return EMPRESTIMOS.filter(item => item.status === "EMPRESTADO");
  }

  if (filtroAtivo === "atrasado") {
    return EMPRESTIMOS.filter(item => {
      if (item.status !== "EMPRESTADO" || !item.prazoEntrega) return false;
      const dataPrazo = parseDateSeguro(item.prazoEntrega);
      return dataPrazo ? new Date() > dataPrazo : false;
    });
  }

  if (filtroAtivo === "devolvido") {
    return EMPRESTIMOS.filter(item => item.status === "DEVOLVIDO");
  }

  return [];
}

// ========================================

function atualizarBotaoApagar() {
  btnApagar.textContent = textosBotao[filtroAtivo] || "🗑️ Apagar";
  const itens = obterItensDoFiltro();
  btnApagar.style.display = itens.length > 0 ? "inline-flex" : "none";
}

// ========================================

function renderizarLista() {
  const lista = document.getElementById("loan-list");
  let origem = [];

  if (filtroAtivo === "todos") {
    origem = [...RESERVAS, ...EMPRESTIMOS];
  } else if (filtroAtivo === "reserva") {
    origem = RESERVAS;
  } else if (filtroAtivo === "ativo") {
    origem = EMPRESTIMOS.filter(item => item.status === "EMPRESTADO");
  } else if (filtroAtivo === "atrasado") {
    origem = EMPRESTIMOS.filter(item => {
      if (item.status !== "EMPRESTADO" || !item.prazoEntrega) return false;
      const dataPrazo = parseDateSeguro(item.prazoEntrega);
      return dataPrazo ? new Date() > dataPrazo : false;
    });
  } else if (filtroAtivo === "devolvido") {
    origem = EMPRESTIMOS.filter(item => item.status === "DEVOLVIDO");
  }

  const itens = origem.filter(item => {
    return termoBusca === ""
      || (item.titulo || item.tituloLivro)
          ?.toLowerCase()
          .includes(termoBusca);
  });

  atualizarBotaoApagar();
  lista.innerHTML = "";

  if (!itens.length) {
    lista.innerHTML = `
      <div class="empty">
        <span class="empty-icon">📚</span>
        Nenhum item encontrado.
      </div>
    `;
    return;
  }

  itens.forEach(item => {
    const isDevolvido = item.status === "DEVOLVIDO";
    const statusTexto = obterStatus(item);

    // Normalização sem acentos do título para bater de forma segura
    const tituloNormalizado = (item.titulo || item.tituloLivro || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // CÓDIGO CORRIGIDO: Permite enviar o resumo para qualquer livro que já tenha sido devolvido.
    const podeResumir = isDevolvido;

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

    if (podeResumir) {
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
            <strong>${statusTexto}</strong>
          </div>
          ${item.dataSolicitacao ? `
          <div class="date-block">
            Criado em
            <strong>${formatar(item.dataSolicitacao)}</strong>
          </div>
          ` : ""}
          ${item.prazoEntrega ? `
          <div class="date-block">
            Devolução
            <strong>${formatar(item.prazoEntrega)}</strong>
          </div>
          ` : ""}
        </div>
        ${podeResumir ? `<small style="color: #2563eb; margin-top: 6px; font-weight: 500; display: block;">✍️ Clique para deixar seu resumo e ganhar 1 moeda!</small>` : ""}
      </div>
      <div class="loan-right">
        <span class="badge ${badgeClass}">
          ${statusTexto}
        </span>
      </div>
    `;

    if (podeResumir) {
      div.addEventListener("click", () => abrirModalEnviarResumoAluno(item));
    }

    lista.appendChild(div);
  });
}

// ========================================
// FILTROS & BUSCA
// ========================================

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    filtroAtivo = btn.dataset.filter;
    renderizarLista();
  });
});

document.getElementById("searchInput").addEventListener("input", e => {
  termoBusca = e.target.value.toLowerCase().trim();
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

// Fechar ao clicar fora do conteúdo
modalResumoAluno?.addEventListener("click", (e) => {
  if (e.target === modalResumoAluno) {
    modalResumoAluno.classList.remove("show");
  }
});

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