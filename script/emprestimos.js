import UsuarioService from "../firebase/services/UsuarioService.js";
import EmprestimoService from "../firebase/services/EmprestimoService.js";
import ReservaService from "../firebase/services/ReservaService.js";
import ResumoService from "../firebase/services/ResumoService.js";

window.PageGuard?.hold();
 
// ========================================

const tbody = document.querySelector("tbody");

let EMPRESTIMOS = [];
let RESERVAS = [];
let filtroAtivo = "todos";

const btnExcluirGeral = document.getElementById("btnExcluirGeral"); 

const modal = document.getElementById("modalAprovacao");
const modalAluno = document.getElementById("modalAluno");
const modalTurma = document.getElementById("modalTurma");
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

// Elementos do Modal de Resumo (Professor)
const modalResumoProfessor = document.getElementById("modalResumoProfessor");
const profResumoAluno = document.getElementById("profResumoAluno");
const profResumoLivro = document.getElementById("profResumoLivro");
const profResumoTexto = document.getElementById("profResumoTexto");
const btnFecharResumoProf = document.getElementById("btnFecharResumoProf");
const btnAprovarResumoProf = document.getElementById("btnAprovarResumoProf");

let reservaSelecionada = null;
let emprestimoSelecionado = null;
let resumoSelecionadoProf = null;
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

    // Renderiza a lista certa dependendo da aba ativa
    if (filtroAtivo === "esperando") {
      renderTabela(RESERVAS);
    } else {
      renderTabela(EMPRESTIMOS);
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:28px;">
        ⚠️ Não foi possível carregar os dados.<br>
        <button class="btn btn-secondary" type="button" id="btnTentarNovamente">Tentar novamente</button>
      </td></tr>`;
    document.getElementById("btnTentarNovamente")?.addEventListener("click", carregar);
    window.showAppMessage?.("Erro ao atualizar dados.");
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

// Função centralizada para filtrar a lista atual (Adaptada ao UsuarioService)
function obterListaFiltrada(lista) {
  const listaVisivel = lista.filter(emp => {
    // CORREÇÃO AQUI: Verifica se foi ocultado no banco pelo seu UsuarioService
    if (emp.visivelAluno === false) {
      return false;
    }

    if (filtroAtivo === "devolucao") {
      return true;
    }

    return emp.status !== "devolvido";
  });

  return listaVisivel.filter(emp => {
    if (modoDevolucao) return true;
    if (filtroAtivo === "todos" || filtroAtivo === "esperando") return true;
    if (!emp.prazoEntrega) return false;

    const hoje = new Date();
    const prazo = emp.prazoEntrega.toDate();

    if (filtroAtivo === "ativo") return hoje <= prazo;
    if (filtroAtivo === "atrasado") return hoje > prazo;

    return true;
  });
}

function renderTabela(lista) {
  tbody.innerHTML = "";

  const listaFiltrada = obterListaFiltrada(lista);

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

    if (modoDevolucao) {
      tr.style.cursor = "pointer";
      if (statusNormal === "devolvido") {
        tr.addEventListener("click", () => abrirModalVerResumoProfessor(emp));
      } else {
        tr.addEventListener("click", () => abrirModalDevolucao(emp));
      }
    }

    if (filtroAtivo === "esperando") {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        abrirAprovacao(emp);
      });
    }

    const nomeAluno = emp.nomeUsuario || emp.usuarioNome || emp.nome || emp.aluno || "-";
    const turmaAluno = emp.turma || emp.alunoTurma || "-";
    const tituloLivro = emp.tituloLivro || emp.livroTitulo || emp.titulo || emp.livro || "-";

    tr.innerHTML = `
      <td>${nomeAluno}</td>
      <td>${turmaAluno}</td>
      <td>${tituloLivro}</td>
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

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase();
  let baseDados = filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS;

  // Usa o filtro base para não buscar itens que foram apagados
  const dadosAtivos = obterListaFiltrada(baseDados);

  const filtrados = dadosAtivos.filter(item => {
    const aluno = (item.nomeUsuario || item.usuarioNome || item.nome || item.aluno || "").toLowerCase();
    const turma = (item.turma || item.alunoTurma || "").toLowerCase();
    const livro = (item.tituloLivro || item.livroTitulo || item.titulo || item.livro || "").toLowerCase();
    
    return aluno.includes(texto) || turma.includes(texto) || livro.includes(texto);
  });

  // Renderiza pulando a filtragem principal para não perder o texto da busca
  tbody.innerHTML = "";
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">Nenhum registro encontrado.</td></tr>`;
    return;
  }
  
  // Reutiliza a lógica de renderização injetando os itens filtrados na tela...
  // Para manter o código simples, desabilitamos o search complexo aqui e usamos apenas o renderTabela
  // modificando as variáveis temporariamente se precisar, ou recriando a tabela.
  // Uma solução melhor é forçar renderTabela a aceitar os filtrados diretos (já o fazemos abaixo)
});

// Correção para o Input Search
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase();
  const baseDados = filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS;
  const listaAtiva = obterListaFiltrada(baseDados);

  if (!texto) {
    renderTabela(baseDados);
    return;
  }

  const result = listaAtiva.filter(item => {
    const aluno = (item.nomeUsuario || item.usuarioNome || item.nome || item.aluno || "").toLowerCase();
    const turma = (item.turma || item.alunoTurma || "").toLowerCase();
    const livro = (item.tituloLivro || item.livroTitulo || item.titulo || item.livro || "").toLowerCase();
    return aluno.includes(texto) || turma.includes(texto) || livro.includes(texto);
  });
  
  // Fake update array apenas para renderização visual da pesquisa
  const bk = filtroAtivo;
  filtroAtivo = "busca-temporaria";
  
  tbody.innerHTML = "";
  result.forEach(emp => {
      // (mesma lógica de tabela simplificada para a busca)
      const tr = document.createElement("tr");
      const statusNormal = normalizarStatus(emp.status);
      let status = statusNormal === "pendente" ? "Aguardando" : statusNormal === "devolvido" ? "Devolvido" : "Em andamento";
      
      tr.innerHTML = `
        <td>${emp.nomeUsuario || emp.nome || "-"}</td>
        <td>${emp.turma || "-"}</td>
        <td>${emp.tituloLivro || emp.titulo || "-"}</td>
        <td>${emp.retiradoEm ? formatar(emp.retiradoEm) : "-"}</td>
        <td>${emp.prazoEntrega ? formatar(emp.prazoEntrega) : "-"}</td>
        <td><span class="status active">${status}</span></td>
      `;
      tbody.appendChild(tr);
  });
  filtroAtivo = bk;
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
  
  const nomeAluno = reserva.nomeUsuario || reserva.usuarioNome || reserva.nome || reserva.aluno || "Não informado";
  const turmaAluno = reserva.turma || reserva.alunoTurma || "Não informada";
  const tituloLivro = reserva.tituloLivro || reserva.livroTitulo || reserva.titulo || reserva.livro || "Não informado";

  modalAluno.textContent = nomeAluno;
  modalTurma.textContent = turmaAluno;
  modalLivro.textContent = tituloLivro;

  const hoje = new Date().toISOString().split("T")[0];
  dataRetiradaInput.value = hoje;
  dataEntregaInput.value = "";
  modal.classList.add("show");
}

btnCancelarModal.addEventListener("click", () => {
  modal.classList.remove("show");
});

btnConfirmarModal.addEventListener("click", async () => {
  if (!reservaSelecionada) return;

  if (!dataRetiradaInput.value || !dataEntregaInput.value) {
    window.showAppMessage?.("Preencha as datas.");
    return;
  }

  try {
    const professor = await UsuarioService.obterUsuarioAtual();
    await EmprestimoService.aprovarReserva({
      reservaId: reservaSelecionada.id,
      professorId: professor.uid,
      dataRetirada: new Date(dataRetiradaInput.value + "T00:00:00"),
      dataEntrega: new Date(dataEntregaInput.value + "T00:00:00")
    });

    window.showAppMessage?.("Empréstimo aprovado.");
    modal.classList.remove("show");

    await carregar();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao aprovar empréstimo.");
  }
});

btnNegarModal.addEventListener("click", async () => {
  if (!reservaSelecionada) return;

  const confirmar = await window.showAppConfirm("Deseja realmente negar esta reserva?", { confirmText: "Negar reserva" });
  if (!confirmar) return;

  try {
    const professor = await UsuarioService.obterUsuarioAtual();
    await ReservaService.recusarReserva(reservaSelecionada.id, professor.uid);

    modal.classList.remove("show");
    await carregar();
    window.showAppMessage?.("Reserva negada.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao negar reserva.");
  }
});

// ========================================
// EXCLUIR GERAL (100% CORRIGIDO E ADAPTADO AO SERVICE)
// ========================================
btnExcluirGeral.addEventListener("click", async () => {
  // Pega apenas os itens que estão filtrados na tela agora
  const listaBase = filtroAtivo === "esperando" ? RESERVAS : EMPRESTIMOS;
  const listaAtual = obterListaFiltrada(listaBase);
  const idsParaApagar = listaAtual.map(item => item.id);

  if (idsParaApagar.length === 0) {
    window.showAppMessage?.("Não há registros visíveis para apagar.");
    return;
  }

  const confirmar = await window.showAppConfirm(`Deseja realmente ${btnExcluirGeral.textContent.toLowerCase()}?`, { confirmText: "Apagar" });
  if (!confirmar) return;

  try {
    const usuario = await UsuarioService.obterUsuarioAtual(); 
    
    if (filtroAtivo === "esperando") {
      // Passa SOMENTE os IDs atuais, prevenindo erro de "No document to update"
      await UsuarioService.ocultarReservas(usuario.uid, idsParaApagar);
      
      // Atualiza a lista local na hora para os itens sumirem imediatamente da tela
      listaAtual.forEach(item => item.visivelAluno = false);
      renderTabela(RESERVAS);
    } else {
      await UsuarioService.ocultarEmprestimos(usuario.uid, idsParaApagar);
      
      listaAtual.forEach(item => item.visivelAluno = false);
      renderTabela(EMPRESTIMOS);
    }
    
    window.showAppMessage?.("Registros apagados com sucesso.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao apagar registros. Ocorreu uma falha no servidor.");
  }
});

// ========================================
// REGISTRAR DEVOLUÇÃO
// ========================================

function abrirModalDevolucao(emprestimo) {
  emprestimoSelecionado = emprestimo;
  devolucaoAluno.textContent = emprestimo.nomeUsuario || emprestimo.usuarioNome || emprestimo.nome || "Não informado";
  devolucaoLivro.textContent = emprestimo.tituloLivro || emprestimo.livroTitulo || emprestimo.titulo || emprestimo.livro || "Não informado";
  devolucaoPrazo.textContent = formatar(emprestimo.prazoEntrega);
  modalDevolucao.classList.add("show");
}

btnCancelarDevolucao.addEventListener("click", () => {
  modalDevolucao.classList.remove("show");
});

btnConfirmarDevolucao.addEventListener("click", async () => {
  if (!emprestimoSelecionado) return;

  try {
    await EmprestimoService.registrarDevolucao(emprestimoSelecionado.id);
    modalDevolucao.classList.remove("show");
    
    await carregar();
    window.showAppMessage?.("Livro devolvido com sucesso.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao registrar devolução.");
  }
});

// ========================================
// AVALIAR RESUMO (PROFESSOR)
// ========================================

async function abrirModalVerResumoProfessor(emprestimo) {
  const resumo = await ResumoService.obterResumoPorEmprestimo(emprestimo.id);

  if (!resumo) {
    window.showAppMessage?.("Este aluno ainda não enviou um resumo para este livro.");
    return;
  }

  resumoSelecionadoProf = resumo;
  profResumoAluno.textContent = resumo.alunoNome || emprestimo.nomeUsuario || emprestimo.usuarioNome || "Não informado";
  profResumoLivro.textContent = resumo.tituloLivro || emprestimo.tituloLivro || emprestimo.livroTitulo || "Não informado";
  profResumoTexto.textContent = resumo.resumo;

  if (resumo.status === "aprovado") {
    btnAprovarResumoProf.disabled = true;
    btnAprovarResumoProf.textContent = "Resumo já Aprovado ✔️";
  } else {
    btnAprovarResumoProf.disabled = false;
    btnAprovarResumoProf.textContent = "Aprovar (+1 🪙)";
  }

  modalResumoProfessor.classList.add("show");
}

btnFecharResumoProf?.addEventListener("click", () => {
  modalResumoProfessor.classList.remove("show");
});

btnAprovarResumoProf?.addEventListener("click", async () => {
  if (!resumoSelecionadoProf) return;

  try {
    await ResumoService.aprovarResumo(resumoSelecionadoProf.id, resumoSelecionadoProf.alunoId);
    window.showAppMessage?.("Resumo aprovado e 1 moeda concedida ao aluno!");
    modalResumoProfessor.classList.remove("show");
    
    await carregar();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao aprovar o resumo.");
  }
});
 
// ========================================
// INICIALIZAÇÃO
// ========================================

carregar()
  .catch((error) => {
    console.error(error);
    window.showAppMessage?.("Erro ao carregar empréstimos.");
  })
  .finally(() => {
    window.PageGuard?.ready();
  });