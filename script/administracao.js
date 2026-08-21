import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";

import ConfiguracaoService from "../firebase/services/ConfiguracaoService.js";
import UsuarioService from "../firebase/services/UsuarioService.js";
import { criarLog, listarLogs, limparTodosLogs } from "../firebase/services/logServices.js";

window.PageGuard?.hold();

const diasEmprestimoInput = document.getElementById("diasEmprestimo");
const maxLivrosInput = document.getElementById("maxLivros");
const ultimoBackupEl = document.getElementById("ultimoBackup");
const tamanhoBackupEl = document.getElementById("tamanhoBackup");
const tbodyUsuarios = document.getElementById("tabelaUsuarios");
const tbodyLogs = document.getElementById("tabelaLogs");
const toast = document.getElementById("toast");

let listaUsuarios = [];
let listaLogs = [];
let currentAdminNome = "Administrador";

const tipoLabel = { admin: "Admin", prof: "Professor", professor: "Professor", aluno: "Aluno", bibliotecario: "Bibliotecário" };
const tipoClass = {
  admin: "badge badge-primary badge-sm text-white",
  prof: "badge badge-info badge-sm text-white",
  professor: "badge badge-info badge-sm text-white",
  aluno: "badge badge-neutral badge-sm",
  bibliotecario: "badge badge-primary badge-sm text-white"
};

const logLabel = { cfg: "Config", back: "Backup", add: "Adição", del: "Remoção", acc: "Acesso", EMPRESTIMO: "Empréstimo", DEVOLUCAO: "Devolução", RESERVA: "Reserva" };
const logClass = {
  cfg: "badge badge-warning badge-sm text-white",
  back: "badge badge-info badge-sm text-white",
  add: "badge badge-success badge-sm text-white",
  del: "badge badge-error badge-sm text-white",
  acc: "badge badge-primary badge-sm text-white",
  EMPRESTIMO: "badge badge-success badge-sm text-white",
  DEVOLUCAO: "badge badge-primary badge-sm text-white",
  RESERVA: "badge badge-warning badge-sm text-white"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodeAction(value) {
  return encodeURIComponent(String(value ?? ""));
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const usuarioLogado = await UsuarioService.obterUsuario(user.uid);

    // UI guard only; Firestore rules remain the real authorization boundary.
    if (!usuarioLogado || usuarioLogado.perfil !== "professor") {
      window.location.href = "indexTelaAluno.html";
      return;
    }

    if (usuarioLogado.nome) currentAdminNome = usuarioLogado.nome;

    await carregarConfiguracoes();
    await carregarUsuarios();
    await carregarLogs();
  } catch (error) {
    console.error("Erro ao inicializar painel:", error);
    mostrarToast("Erro ao carregar dados do sistema.");
  } finally {
    window.PageGuard?.ready();
  }
});

async function carregarConfiguracoes() {
  try {
    const regras = await ConfiguracaoService.obterRegras();
    diasEmprestimoInput.value = regras.diasEmprestimo || 7;
    maxLivrosInput.value = regras.maxLivrosPorAluno || 3;

    if (regras.ultimoBackup) {
      ultimoBackupEl.textContent = formatarData(regras.ultimoBackup);
      tamanhoBackupEl.textContent = "4.2 MB";
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
  }
}

async function carregarUsuarios() {
  try {
    listaUsuarios = await UsuarioService.listarTodos();
    renderUsuarios();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    tbodyUsuarios.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-base-content/50">Erro ao carregar usuários.</td></tr>`;
  }
}

async function carregarLogs() {
  try {
    listaLogs = await listarLogs(50);
    renderLogs();
  } catch (error) {
    console.error("Erro ao carregar logs:", error);
    tbodyLogs.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-base-content/50">Erro ao carregar logs.</td></tr>`;
  }
}

function renderUsuarios() {
  if (!listaUsuarios?.length) {
    tbodyUsuarios.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-base-content/50">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  tbodyUsuarios.innerHTML = listaUsuarios.map((u) => {
    const tipoF = u.perfil || "aluno";
    const ativoStatus = u.ativo !== false;
    const tipoStr = escapeHtml(tipoLabel[tipoF] || tipoF);
    const classeStr = tipoClass[tipoF] || "badge badge-neutral badge-sm";
    const nome = u.nome || "Sem Nome";
    const uid = u.id || u.uid || "";

    return `
      <tr>
        <td class="font-medium text-base-content">${escapeHtml(nome)}</td>
        <td class="text-base-content/70">${escapeHtml(u.email || "Sem Email")}</td>
        <td><span class="${classeStr}">${tipoStr}</span></td>
        <td>
          <span class="${ativoStatus ? "text-success font-semibold" : "text-error font-semibold"}">
            ${ativoStatus ? "● Ativo" : "○ Inativo"}
          </span>
        </td>
        <td>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-xs btn-outline" onclick="window.editarPermissao(decodeURIComponent('${encodeAction(uid)}'), decodeURIComponent('${encodeAction(nome)}'))">✎ Editar</button>
            <button class="btn btn-xs btn-outline ${ativoStatus ? "btn-error" : "btn-success"}"
                    onclick="window.toggleStatus(decodeURIComponent('${encodeAction(uid)}'), ${ativoStatus}, decodeURIComponent('${encodeAction(nome)}'))">
              ${ativoStatus ? "○ Desativar" : "● Ativar"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderLogs() {
  if (!listaLogs?.length) {
    tbodyLogs.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-base-content/50 italic">Nenhum log registrado.</td></tr>`;
    return;
  }

  tbodyLogs.innerHTML = listaLogs.map((l) => {
    const dataHora = formatarData(l.criadoEm);
    const logTipoStr = logLabel[l.tipo] || "Sistema";
    const logClasseStr = logClass[l.tipo] || "badge badge-neutral badge-sm";
    const acaoTexto = l.detalhes || l.acao || `Ação: ${l.tipo || "Sistema"}`;

    return `
      <tr>
        <td class="text-xs text-base-content/70">${escapeHtml(dataHora)}</td>
        <td><span class="${logClasseStr}">${escapeHtml(logTipoStr)}</span></td>
        <td>${escapeHtml(acaoTexto)}</td>
        <td class="text-xs text-base-content/70">${escapeHtml(l.nomeUsuario || l.usr || "Sistema")}</td>
      </tr>
    `;
  }).join("");
}

async function salvarRegras() {
  const dias = Math.min(60, Math.max(1, parseInt(diasEmprestimoInput.value, 10) || 7));
  const max = Math.min(20, Math.max(1, parseInt(maxLivrosInput.value, 10) || 3));

  try {
    await ConfiguracaoService.salvarRegras(dias, max);
    await registrarLog("cfg", `Regras alteradas: ${dias} dias de empréstimo / máx. ${max} livros`);
    mostrarToast(`✓ Regras salvas: ${dias} dias · máx. ${max} livros`);
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao salvar regras.");
  }
}

async function fazerBackup() {
  try {
    await ConfiguracaoService.registrarBackup();
    await registrarLog("back", "Backup manual do banco de dados executado");
    mostrarToast("Backup concluído com sucesso!");
    setTimeout(() => carregarConfiguracoes(), 1000);
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao executar backup.");
  }
}

async function limparLogsAcao() {
  const confirmar = confirm("Tem certeza que deseja apagar todos os logs? Esta ação não pode ser desfeita.");
  if (!confirmar) return;

  try {
    await limparTodosLogs();
    listaLogs = [];
    renderLogs();
    await registrarLog("del", "Logs do sistema foram limpos");
    mostrarToast("Logs do sistema limpos com sucesso.");
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao limpar logs.");
  }
}

window.toggleStatus = async function(uid, estadoAtual, nome) {
  try {
    if (!uid) throw new Error("Usuário inválido.");
    await UsuarioService.atualizar(uid, { ativo: !estadoAtual, atualizadoEm: new Date() });

    const acaoText = !estadoAtual ? "ativado" : "desativado";
    await registrarLog("cfg", `Usuário ${nome} foi ${acaoText}`);
    mostrarToast(`${nome} foi ${acaoText}.`);
    await carregarUsuarios();
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao alterar status do usuário.");
  }
};

window.editarPermissao = function(uid, nome) {
  mostrarToast(`✎ Recurso de editar permissão em desenvolvimento para: ${nome}`);
};

async function registrarLog(tipo, acao) {
  try {
    await criarLog({ tipo, detalhes: acao, nomeUsuario: currentAdminNome });
    await carregarLogs();
  } catch (error) {
    console.error("Erro ao criar log:", error);
  }
}

function formatarData(timestamp) {
  if (!timestamp) return "-";
  const dateObj = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
  return dateObj.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function mostrarToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 3500);
}

document.getElementById("btnSalvarRegras")?.addEventListener("click", salvarRegras);
document.getElementById("btnBackup")?.addEventListener("click", fazerBackup);
document.getElementById("btnLimparLogs")?.addEventListener("click", limparLogsAcao);
document.getElementById("btnBaixar")?.addEventListener("click", () => {
  mostrarToast("↓ Download do backup iniciado (Simulado).");
});
