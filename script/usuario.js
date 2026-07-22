// ========================================
// IMPORTS
// ========================================
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";
import UsuarioService from "../firebase/services/UsuarioService.js";
import EmprestimoService from "../firebase/services/EmprestimoService.js";
import NotificacaoService from "../firebase/services/NotificacaoService.js";

window.PageGuard?.hold();

// ========================================
// ELEMENTOS
// ========================================
const nomeUsuario = document.getElementById("nomeUsuario");
const matriculaUsuario = document.getElementById("matriculaUsuario");
const turmaUsuario = document.getElementById("turmaUsuario");
const moedasUsuario = document.getElementById("moedasUsuario");
const historicoDiv = document.getElementById("historicoLeituras");
const notificacoesDiv = document.getElementById("notificacoes");
const heroTitulo = document.querySelector(".hero h1");

// ========================================
// FORMATADOR DE DATA
// ========================================
function formatar(timestamp) {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  }
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

// ========================================
// RENDERIZAR HISTÓRICO (Vindo de EmprestimoService)
// ========================================
function renderHistorico(historico) {
  historicoDiv.innerHTML = "";

  if (!historico || historico.length === 0) {
    historicoDiv.innerHTML = `
      <div class="item">
        Nenhum livro retirado.
      </div>
    `;
    return;
  }

  historico.forEach((livro) => {
    const div = document.createElement("div");
    div.className = "item";

    // Padronização dos nomes das propriedades
    const titulo = livro.titulo || livro.tituloLivro || "Livro sem título";
    const retirada = formatar(livro.retiradoEm || livro.dataRetirada);
    const devolucao = formatar(livro.devolvidoEm || livro.dataDevolucao || livro.atualizadoEm);

    div.innerHTML = `
      <strong>${titulo}</strong>
      • Retirada: ${retirada}
      • Devolução: ${devolucao}
      • Status: Devolvido
    `;

    historicoDiv.appendChild(div);
  });
}

// ========================================
// RENDERIZAR NOTIFICAÇÕES (Vindo de NotificacaoService)
// ========================================
function renderNotificacoes(notificacoes) {
  notificacoesDiv.innerHTML = "";

  if (!notificacoes || notificacoes.length === 0) {
    notificacoesDiv.innerHTML = `
      <div class="notif">
        Nenhuma notificação.
      </div>
    `;
    return;
  }

  notificacoes.forEach((notif) => {
    const div = document.createElement("div");
    div.className = `notif ${notif.lida ? "lida" : "nao-lida"}`;

    const mensagem = notif.mensagem || "Nova atualização no sistema.";
    const dataNotif = formatar(notif.data || notif.criadoEm);

    div.innerHTML = `
      <div class="notif-content">
        <span class="notif-text">${mensagem}</span>
        <small class="notif-date">${dataNotif}</small>
      </div>
    `;

    notificacoesDiv.appendChild(div);
  });
}

// ========================================
// VERIFICAR LOGIN E CARREGAR DADOS
// ========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "pages/login.html";
    return;
  }

  try {
    // 1. Carrega dados cadastrais do Usuário
    const dados = await UsuarioService.obterUsuario(user.uid);

    if (!dados) {
      window.showAppMessage?.("Usuário não encontrado.");
      return;
    }

    // Preenche o perfil e moedas na tela
    heroTitulo.innerText = `Bem-vindo(a), ${dados.nome}`;
    nomeUsuario.innerText = dados.nome || "Não definido";
    matriculaUsuario.innerText = dados.matricula || "Não definida";
    turmaUsuario.innerText = dados.turma || "Não definida";
    
    if (moedasUsuario) {
      moedasUsuario.innerText = `${dados.moedas || 0} 🪙`;
    }

    // 2. Carrega histórico real do banco de dados (Status: DEVOLVIDO)
    const historico = await EmprestimoService.listarHistoricoUsuario(user.uid);
    renderHistorico(historico);

    // 3. Carrega as notificações reais da coleção de notificações
    const notificacoes = await NotificacaoService.listarUsuario(user.uid);
    renderNotificacoes(notificacoes);

  } catch (error) {
    console.error("Erro ao carregar perfil do usuário:", error);
    window.showAppMessage?.("Erro ao carregar perfil.");
  } finally {
    window.PageGuard?.ready();
  }
});

// ========================================
// ATUALIZAR PERFIL / ALTERAR SENHA
// ========================================
document.getElementById("btnAtualizarPerfil")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  const btn = document.getElementById("btnAtualizarPerfil");
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';
  }

  try { 
    const dados = await UsuarioService.obterUsuario(user.uid);
    if (!dados) {
      window.showAppMessage?.("Usuário não encontrado.");
      return;
    }

    heroTitulo.innerText = `Bem-vindo(a), ${dados.nome}`;
    nomeUsuario.innerText = dados.nome || "Não definido";
    matriculaUsuario.innerText = dados.matricula || "Não definida";
    turmaUsuario.innerText = dados.turma || "Não definida";
    
    if (moedasUsuario) {
      moedasUsuario.innerText = `${dados.moedas || 0} 🪙`;
    }

    const historico = await EmprestimoService.listarHistoricoUsuario(user.uid);
    renderHistorico(historico);

    const notificacoes = await NotificacaoService.listarUsuario(user.uid);
    renderNotificacoes(notificacoes);

    window.showAppMessage?.("Dados atualizados com sucesso.");
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao atualizar os dados.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '↻ Atualizar Dados';
    }
  }
});

document.getElementById("btnAlterarSenha")?.addEventListener("click", async () => {
  const novaSenha = document.getElementById("novaSenha").value;

  if (novaSenha.length < 6) {
    window.showAppMessage?.("Senha precisa ter no mínimo 6 caracteres.");
    return;
  }

  try {
    await UsuarioService.alterarSenha(novaSenha);
    window.showAppMessage?.("Senha alterada com sucesso!");
    document.getElementById("novaSenha").value = "";
  } catch (error) {
    console.error("Erro ao alterar a senha:", error);
    window.showAppMessage?.("Erro ao alterar senha.");
  }
});