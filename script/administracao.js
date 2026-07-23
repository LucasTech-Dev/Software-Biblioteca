import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";

// IMPORTAÇÃO EXCLUSIVA DOS SERVICES (SEM ACESSO DIRETO AO FIRESTORE)
import ConfiguracaoService from "../firebase/services/ConfiguracaoService.js";
import UsuarioService from "../firebase/services/UsuarioService.js";
import { criarLog, listarLogs, limparTodosLogs } from "../firebase/services/logServices.js"; 

window.PageGuard?.hold();

// ========================================
// ELEMENTOS E VARIÁVEIS GLOBAIS
// ========================================
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

// Mapeamentos Visuais
const tipoLabel = { admin: "Admin", prof: "Professor", aluno: "Aluno", bibliotecario: "Bibliotecário" };
const tipoClass = { admin: "role-admin", prof: "role-prof", aluno: "role-aluno", bibliotecario: "role-admin" };

const logLabel = { cfg: "Config", back: "Backup", add: "Adição", del: "Remoção", acc: "Acesso", EMPRESTIMO: "Empréstimo", DEVOLUCAO: "Devolução", RESERVA: "Reserva" };
const logClass = { cfg: "log-cfg", back: "log-back", add: "log-add", del: "log-del", acc: "log-acc", EMPRESTIMO: "log-add", DEVOLUCAO: "log-acc", RESERVA: "log-cfg" };

// ========================================
// INICIALIZAÇÃO
// ========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Busca nome do Admin via Service
    const usuarioLogado = await UsuarioService.obterUsuario(user.uid);
    if (usuarioLogado && usuarioLogado.nome) {
      currentAdminNome = usuarioLogado.nome;
    }

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

// ========================================
// FUNÇÕES DE BUSCA DE DADOS (READ)
// ========================================
async function carregarConfiguracoes() {
  try {
    const regras = await ConfiguracaoService.obterRegras();
    
    diasEmprestimoInput.value = regras.diasEmprestimo || 7;
    maxLivrosInput.value = regras.maxLivrosPorAluno || 3;
    
    if (regras.ultimoBackup) {
      ultimoBackupEl.textContent = formatarData(regras.ultimoBackup);
      tamanhoBackupEl.textContent = "4.2 MB"; // Estático para UI
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
  }
}

async function carregarUsuarios() {
  try {
    // Usamos o Service para buscar todos os usuários
    listaUsuarios = await UsuarioService.listarTodos(); 
    renderUsuarios();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    tbodyUsuarios.innerHTML = `<tr><td colspan="5" style="text-align:center;">Erro ao carregar usuários.</td></tr>`;
  }
}

async function carregarLogs() {
  try {
    // Usamos o Service de Logs
    listaLogs = await listarLogs(50); // Função no service que busca os 50 mais recentes
    renderLogs();
  } catch (error) {
    console.error("Erro ao carregar logs:", error);
    tbodyLogs.innerHTML = `<tr><td colspan="4" style="text-align:center;">Erro ao carregar logs.</td></tr>`;
  }
}

// ========================================
// FUNÇÕES DE RENDERIZAÇÃO
// ========================================
function renderUsuarios() {
  if (!listaUsuarios || !listaUsuarios.length) {
    tbodyUsuarios.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  tbodyUsuarios.innerHTML = listaUsuarios.map(u => {
    const tipoF = u.perfil || "aluno"; 
    const ativoStatus = u.ativo !== false; 
    const tipoStr = tipoLabel[tipoF] || tipoF;
    const classeStr = tipoClass[tipoF] || "role-aluno";

    return `
      <tr>
        <td style="font-weight:500;color:#1a2740;">${u.nome || 'Sem Nome'}</td>
        <td style="color:#5a80aa;">${u.email || 'Sem Email'}</td>
        <td><span class="role-tag ${classeStr}">${tipoStr}</span></td>
        <td>
          <span class="${ativoStatus ? 'status-ativo' : 'status-inativo'}">
            ${ativoStatus ? '● Ativo' : '○ Inativo'}
          </span>
        </td>
        <td class="table-actions">
          <button class="btn-sm btn-sm--edit" onclick="window.editarPermissao('${u.id || u.uid}', '${u.nome}')">✎ Editar</button>
          <button class="btn-sm ${ativoStatus ? 'btn-sm--toggle-off' : 'btn-sm--toggle-on'}"
                  onclick="window.toggleStatus('${u.id || u.uid}', ${ativoStatus}, '${u.nome}')">
            ${ativoStatus ? '○ Desativar' : '● Ativar'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderLogs() {
  if (!listaLogs || !listaLogs.length) {
    tbodyLogs.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#8aabcc;padding:24px;font-style:italic;">
          Nenhum log registrado.
        </td>
      </tr>`;
    return;
  }

  tbodyLogs.innerHTML = listaLogs.map(l => {
    const dataHora = formatarData(l.criadoEm);
    const logTipoStr = logLabel[l.tipo] || "Sistema";
    const logClasseStr = logClass[l.tipo] || "log-cfg";
    const acaoTexto = l.detalhes ? l.detalhes : (l.acao || `Ação: ${l.tipo}`);

    return `
      <tr>
        <td style="color:#5a80aa;font-size:12px;">${dataHora}</td>
        <td><span class="log-tag ${logClasseStr}">${logTipoStr}</span></td>
        <td>${acaoTexto}</td>
        <td style="color:#5a80aa;font-size:12px;">${l.nomeUsuario || l.usr || 'Sistema'}</td>
      </tr>
    `;
  }).join('');
}

// ========================================
// AÇÕES DO SISTEMA (VIA SERVICES)
// ========================================

async function salvarRegras() {
  const dias = parseInt(diasEmprestimoInput.value) || 7;
  const max = parseInt(maxLivrosInput.value) || 3;

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
    await limparTodosLogs(); // Função que deve existir no seu logServices.js
    listaLogs = [];
    renderLogs();
    
    await registrarLog("del", "Logs do sistema foram limpos");
    mostrarToast("Logs do sistema limpos com sucesso.");
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao limpar logs.");
  }
}

// ========================================
// AÇÕES DOS USUÁRIOS (Expostas ao Window)
// ========================================

window.toggleStatus = async function(uid, estadoAtual, nome) {
  try {
    const novoEstado = !estadoAtual;
    // Precisamos que o UsuarioService tenha um método de atualizar
    await UsuarioService.atualizar(uid, { ativo: novoEstado });

    const acaoText = novoEstado ? "ativado" : "desativado";
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

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

async function registrarLog(tipo, acao) {
  try {
    await criarLog({
      tipo: tipo,
      detalhes: acao,
      nomeUsuario: currentAdminNome
    });
    await carregarLogs(); 
  } catch (error) {
    console.error("Erro ao criar log:", error);
  }
}

function formatarData(timestamp) {
  if (!timestamp) return "-";
  const dateObj = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  
  return dateObj.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function mostrarToast(msg) {
  toast.textContent = msg;
  toast.style.display = "flex";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = "none"; }, 3500);
}

// ========================================
// EVENT LISTENERS DE BOTÕES
// ========================================
document.getElementById("btnSalvarRegras")?.addEventListener("click", salvarRegras);
document.getElementById("btnBackup")?.addEventListener("click", fazerBackup);
document.getElementById("btnLimparLogs")?.addEventListener("click", limparLogsAcao);
document.getElementById("btnBaixar")?.addEventListener("click", () => {
  mostrarToast("↓ Download do backup iniciado (Simulado).");
});