import UsuarioService from "../firebase/services/UsuarioService.js";
import EmprestimoService from "../firebase/services/EmprestimoService.js";
import ReservaService from "../firebase/services/ReservaService.js";

window.PageGuard?.hold();
 
// ========================================

const tbody = document.querySelector("tbody");

let EMPRESTIMOS = [];
let RESERVAS = [];
let filtroAtivo = "todos";

let EMPRESTIMOS_OCULTOS = [];
let RESERVAS_OCULTAS = [];

const btnExcluirGeral = document.getElementById("btnExcluirGeral"); 

const modal = document.getElementById("modalAprovacao");
const modalAluno = document.getElementById("modalAluno");
const modalLivro = document.getElementById("modalLivro");
const dataRetiradaInput = document.getElementById("dataRetirada");
const dataEntregaInput = document.getElementById("dataEntrega");

const btnCancelarModal = document.getElementById("btnCancelarModal");
const btnConfirmarModal = document.getElementById("btnConfirmarModal");
const btnNegarModal = document.getElementById("btnNegarModal");

const modalDevolucao = document.getElementById("modalDevolucao");
const devolucaoAluno = document.getElementById("devolucaoAluno");
const devolucaoLivro = document.getElementById("devolucaoLivro");
const devolucaoPrazo = document.getElementById("devolucaoPrazo");
const btnCancelarDevolucao = document.getElementById("btnCancelarDevolucao");
const btnConfirmarDevolucao = document.getElementById("btnConfirmarDevolucao");

let reservaSelecionada = null;
let emprestimoSelecionado = null;
let modoDevolucao = false;
let carregandoEmprestimos = false;

// ========================================

async function carregar() {
  if (carregandoEmprestimos) return;
  carregandoEmprestimos = true;
  const btn = document.getElementById('btnAtualizarEmprestimos');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';
  }

  try {
    EMPRESTIMOS = await EmprestimoService.listarEmprestimosProfessor();
    RESERVAS = await ReservaService.listarReservasProfessor();

    const usuario = await UsuarioService.obterUsuarioAtual();

    EMPRESTIMOS_OCULTOS = usuario?.emprestimosOcultos || [];
    RESERVAS_OCULTAS = usuario?.reservasOcultas || [];

    renderTabela(EMPRESTIMOS);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:28px;">
        ⚠️ Não foi possível carregar os empréstimos.<br>
        <button class="btn btn-secondary" type="button" id="btnTentarNovamente">Tentar novamente</button>
      </td></tr>`;
    document.getElementById("btnTentarNovamente")?.addEventListener("click", carregar);
    window.showAppMessage?.("Erro ao atualizar empréstimos.");
  } finally {
    carregandoEmprestimos = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '↻ Atualizar';
    }
  }
}

// ========================================

function normalizarStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function renderTabela(lista) {
  tbody.innerHTML = "";

  const ocultos = filtroAtivo === "esperando" ? RESERVAS_OCULTAS : EMPRESTIMOS_OCULTOS;

  const listaVisivel = lista.filter(emp => {
    if (ocultos.includes(emp.id)) {
      return false;
    }

    // no modo devolução mostra ativos E devolvidos
    if (filtroAtivo === "devolucao") {
      return true;
    }

    return emp.status !== "devolvido";
  });

  const listaFiltrada = listaVisivel.filter(emp => {
    if (modoDevolucao) {
      return true;
    }

    if (filtroAtivo === "todos" || filtroAtivo === "esperando") {
      return true;
    }

    if (!emp.prazoEntrega) {
      return false;
    }

    // TODO: Esta lógica de datas e status será removida do frontend 
    // e transferida para o EmprestimoService na Etapa 2.
    const hoje = new Date();
    const prazo = emp.prazoEntrega.toDate();

    if (filtroAtivo === "ativo") {
      return hoje <= prazo;
    }

    if (filtroAtivo === "atrasado") {
      return hoje > prazo;
    }

    return true;
  });

  if (!listaFiltrada.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px;">
          Nenhum registro encontrado.
        </td>
      </tr>
    `;
    return;
  }

  listaFiltrada.forEach(emp => {
    const statusNormal = normalizarStatus(emp.status);
    let status = "Em andamento";
    let statusClass = "active";

    if (statusNormal === "pendente") {
      status = "Aguardando";
      statusClass = "active";
    } else if (statusNormal === "devolvido") {
      status = "Devolvido";
      statusClass = "returned";
    } else {
      const hoje = new Date();
      const prazo = emp.prazoEntrega ? emp.prazoEntrega.toDate() : null;

      if (prazo && hoje > prazo) {
        status = "Atrasado";
        statusClass = "delayed";
      }
    }

    const tr = document.createElement("tr");

    if (modoDevolucao && statusNormal !== "devolvido") {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        abrirModalDevolucao(emp);
      });
    }

    if (filtroAtivo === "esperando") {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        abrirAprovacao(emp);
      });
    }

    tr.innerHTML = `
      <td>${emp.nomeUsuario || emp.nome || "-"}</td>
      <td>${emp.turma || "-"}</td>
      <td>${emp.tituloLivro || "-"}</td>
      <td>${emp.retiradoEm ? formatar(emp.retiradoEm) : "-"}</td>
      <td>${emp.prazoEntrega ? formatar(emp.prazoEntrega) : "-"}</td>
      <td>
        <span class="status ${statusClass}">
          ${status}
        </span>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ========================================

function formatar(timestamp) {
  if (!timestamp) return "-";
  return timestamp.toDate().toLocaleDateString("pt-BR");
}

// ========================================

document.getElementById("btnAtualizarEmprestimos")?.addEventListener("click", () => {
  carregar();
});

window.PageGuard?.enablePullToRefresh(carregar);

document.getElementById("searchInput").addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase();
  let baseDados = filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS;

  const filtrados = baseDados.filter(item =>
    item.nomeUsuario?.toLowerCase().includes(texto) ||
    item.nome?.toLowerCase().includes(texto) ||
    item.tituloLivro?.toLowerCase().includes(texto) ||
    item.turma?.toLowerCase().includes(texto)
  );

  renderTabela(filtrados);
});

// ========================================

document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => {
      b.classList.remove("btn-primary");
      b.classList.remove("active");
    });

    btn.classList.add("btn-primary");
    btn.classList.add("active");

    filtroAtivo = btn.dataset.filter;

    const textosBotao = {
      todos: "🗑️ Apagar Todos",
      ativo: "🗑️ Apagar Empréstimos",
      atrasado: "🗑️ Apagar Atrasados",
      esperando: "🗑️ Apagar Reservas"
    };

    btnExcluirGeral.textContent = textosBotao[filtroAtivo] || "🗑️ Apagar";

    if (filtroAtivo === "devolucao") {
      btnExcluirGeral.style.display = "none";
    } else {
      btnExcluirGeral.style.display = "inline-flex";
    }

    if (filtroAtivo === "esperando") {
      modoDevolucao = false;
      renderTabela(RESERVAS);
      return;
    }

    if (filtroAtivo === "devolucao") {
      modoDevolucao = true;
      renderTabela(EMPRESTIMOS);
      return;
    }

    modoDevolucao = false;
    renderTabela(EMPRESTIMOS);
  });
});

// ========================================
// APROVAR RESERVA
// ========================================

function abrirAprovacao(reserva) {
  reservaSelecionada = reserva;
  modalAluno.textContent = reserva.nomeUsuario;
  modalLivro.textContent = reserva.tituloLivro;

  const hoje = new Date().toISOString().split("T")[0];
  dataRetiradaInput.value = hoje;
  dataEntregaInput.value = "";
  modal.classList.add("show");
}

btnCancelarModal.addEventListener("click", () => {
  modal.classList.remove("show");
});

btnConfirmarModal.addEventListener("click", async () => {
  if (!reservaSelecionada) {
    return;
  }

  if (!dataRetiradaInput.value || !dataEntregaInput.value) {
    window.showAppMessage?.("Preencha as datas.");
    return;
  }

  try {
    // Alteração 2: Enviando o ID do professor que aprovou e as datas.
    const professor = await UsuarioService.obterUsuarioAtual();
    await EmprestimoService.aprovarReserva({
      reservaId: reservaSelecionada.id,
      professorId: professor.uid,
      dataRetirada: new Date(dataRetiradaInput.value + "T00:00:00"),
      dataEntrega: new Date(dataEntregaInput.value + "T00:00:00")
    });

    window.showAppMessage?.("Empréstimo aprovado.");
    modal.classList.remove("show");

    // Alteração 6: Carregando e renderizando.
    await carregar();
    filtroAtivo = "esperando";
    renderTabela(filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS);

  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao aprovar empréstimo.");
  }
});


btnNegarModal.addEventListener("click", async () => {
  if (!reservaSelecionada) {
    return;
  }

  const confirmar = await window.showAppConfirm("Deseja realmente negar esta reserva?", { confirmText: "Negar reserva" });
  if (!confirmar) {
    return;
  }

  try {
    // Alteração 3: Chamando o método recusarReserva do Service passando o professor.
    const professor = await UsuarioService.obterUsuarioAtual();
    await ReservaService.recusarReserva(reservaSelecionada.id, professor.uid);

    modal.classList.remove("show");

    // Alteração 6: Carregando e renderizando.
    await carregar();
    filtroAtivo = "esperando";
    renderTabela(filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS);

    window.showAppMessage?.("Reserva negada.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao negar reserva.");
  }
});


btnExcluirGeral.addEventListener("click", async () => {
  const confirmar = await window.showAppConfirm(`Deseja realmente ${btnExcluirGeral.textContent.toLowerCase()}?`, { confirmText: "Apagar" });
  if (!confirmar) {
    return;
  }

  try {
    const usuario = await UsuarioService.obterUsuarioAtual(); // Garantindo acesso ao user no escopo correto
    if (filtroAtivo === "esperando") {
      const ids = RESERVAS.filter(r => !RESERVAS_OCULTAS.includes(r.id)).map(r => r.id);
      await UsuarioService.ocultarReservas(usuario.uid, ids);
      RESERVAS_OCULTAS = [...RESERVAS_OCULTAS, ...ids];
      renderTabela(RESERVAS);
    } else {
      const ids = EMPRESTIMOS.filter(e => !EMPRESTIMOS_OCULTOS.includes(e.id)).map(e => e.id);
      await UsuarioService.ocultarEmprestimos(usuario.uid, ids);
      EMPRESTIMOS_OCULTOS = [...EMPRESTIMOS_OCULTOS, ...ids];
      renderTabela(EMPRESTIMOS);
    }
    window.showAppMessage?.("Registros apagados com sucesso.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao ocultar registros.");
  }
});

// ========================================
// REGISTRAR DEVOLUÇÃO
// ========================================

function abrirModalDevolucao(emprestimo) {
  emprestimoSelecionado = emprestimo;
  devolucaoAluno.textContent = emprestimo.nomeUsuario;
  devolucaoLivro.textContent = emprestimo.tituloLivro;
  devolucaoPrazo.textContent = formatar(emprestimo.prazoEntrega);
  modalDevolucao.classList.add("show");
}

btnCancelarDevolucao.addEventListener("click", () => {
  modalDevolucao.classList.remove("show");
});

btnConfirmarDevolucao.addEventListener("click", async () => {
  if (!emprestimoSelecionado) {
    return;
  }

  try {
    // Alteração 5: Usando o método registrarDevolucao do novo Service
    await EmprestimoService.registrarDevolucao(emprestimoSelecionado.id);
    
    modalDevolucao.classList.remove("show");

    // Alteração 6: Carregando e renderizando.
    await carregar();
    filtroAtivo = "devolucao";
    modoDevolucao = true;
    renderTabela(filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS);

    window.showAppMessage?.("Livro devolvido com sucesso.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao registrar devolução.");
  }
});

carregar()
  .catch((error) => {
    console.error(error);
    window.showAppMessage?.("Erro ao carregar empréstimos.");
  })
  .finally(() => {
    window.PageGuard?.ready();
  });
