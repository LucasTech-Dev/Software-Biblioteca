// ========================================
// FIREBASE
// ========================================

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "../firebase/auth.js";

// ========================================
// ELEMENTOS
// ========================================

const elements = {
  lblId: document.getElementById("lbl-id"),
  inpId: document.getElementById("inp-id"),
  inpSenha: document.getElementById("inp-senha"),
  btnEntrar: document.getElementById("btn-entrar"),
  optProfessor: document.getElementById("opt-professor"),
  optAluno: document.getElementById("opt-aluno")
};
// ========================================
// MOSTRAR / OCULTAR SENHA
// ========================================

const togglePassword =
  document.getElementById(
    "toggle-password"
  );

if (togglePassword) {

  togglePassword.addEventListener(
    "click",
    () => {

      const visivel =
        elements.inpSenha.type ===
        "text";

      elements.inpSenha.type =
        visivel
          ? "password"
          : "text";

      togglePassword.innerHTML =
        visivel
          ? `
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2">

              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"/>

              <circle
                  cx="12"
                  cy="12"
                  r="3"/>

          </svg>
          `
          : `
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2">

              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.94 17.94A10.94 10.94 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.95 10.95 0 012.88-4.568"/>

              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M1 1l22 22"/>

              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.88 9.88A3 3 0 0014.12 14.12"/>

          </svg>
          `;
    }
  );

}
// ========================================
// CONFIGURAÇÕES
// ========================================

const roleConfig = {
  professor: {
    placeholder: "Ex: professor@educar.rs.gov.br",
    domain: "@educar",
    errorMessage:
      "Email inválido. O email do professor deve conter @educar."
  },

  aluno: {
    placeholder: "Ex: aluno@estudante.rs.gov.br",
    domain: "@estudante",
    errorMessage:
      "Email inválido. O email do aluno deve conter @estudante."
  }
};

// ========================================
// ESTADO
// ========================================

let role = null;

// ========================================
// LIMPAR ERRO
// ========================================

function clearError() {
  elements.inpId.classList.remove("input-error");

  const msg = document.getElementById(
    "msg-email-invalido"
  );

  if (msg) {
    msg.remove();
  }
}

// ========================================
// MOSTRAR ERRO
// ========================================

function showError(message) {
  clearError();

  elements.inpId.classList.add(
    "input-error"
  );

  const msg =
    document.createElement("span");

  msg.id = "msg-email-invalido";

  msg.textContent = message;

  msg.style.color = "var(--error)";
  msg.style.fontSize = "13px";
  msg.style.marginTop = "5px";
  msg.style.display = "block";

  elements.inpId.insertAdjacentElement(
    "afterend",
    msg
  );
}

// ========================================
// BOTÃO LOADING
// ========================================

function setLoading(status) {
  elements.btnEntrar.disabled =
    status;

  elements.btnEntrar.textContent =
    status
      ? "Verificando..."
      : "Entrar";
}

// ========================================
// VALIDAR EMAIL POR PERFIL
// ========================================

function validateRoleEmail(
  email,
  currentRole
) {
  const config =
    roleConfig[currentRole];

  if (!config) {
    return false;
  }

  return email.includes(
    config.domain
  );
}

// ========================================
// SELECIONAR PERFIL
// ========================================

window.selectRole = function (r) {
  role = r;

  elements.optProfessor.classList.toggle(
    "active",
    r === "professor"
  );

  elements.optAluno.classList.toggle(
    "active",
    r === "aluno"
  );

  clearError();

  const config = roleConfig[r];

  elements.lblId.textContent =
    "E-mail Institucional";

  elements.inpId.placeholder =
    config.placeholder;

  elements.inpId.type = "email";
};

// ========================================
// MENSAGENS FIREBASE
// ========================================

const firebaseErrors = {
  "auth/user-not-found":
    "Nenhum usuário encontrado com esse email.",

  "auth/wrong-password":
    "Senha incorreta.",

  "auth/invalid-email":
    "Formato de email inválido.",

  "auth/too-many-requests":
    "Muitas tentativas. Tente novamente mais tarde."
};

// ========================================
// LOGIN
// ========================================

window.handleLogin =
  async function () {

    // ===============================
    // PERFIL
    // ===============================

    if (!role) {
      alert(
        "Selecione o perfil antes de continuar."
      );

      return;
    }

    // ===============================
    // CAMPOS
    // ===============================

    const email =
      elements.inpId.value.trim();

    const senha =
      elements.inpSenha.value.trim();

    // ===============================
    // VALIDAÇÃO
    // ===============================

    if (!email || !senha) {
      alert(
        "Preencha todos os campos."
      );

      return;
    }

    clearError();

    if (
      !validateRoleEmail(
        email,
        role
      )
    ) {
      showError(
        roleConfig[role]
          .errorMessage
      );

      return;
    }

    // ===============================
    // LOGIN
    // ===============================

    setLoading(true);

    try {
      const response =
        await signInWithEmailAndPassword(
          auth,
          email,
          senha
        );

      console.log(
        "Login realizado com sucesso"
      );

      console.log(
        response.user
      );

      // ===========================
      // REDIRECIONAMENTO
      // ===========================

      if (
        role === "professor"
      ) {
        window.location.href =
          "telaProfessor.html";

        return;
      }

      if (
        role === "aluno"
      ) {
        window.location.href =
          "indexTelaAluno.html";

        return;
      }

    } catch (error) {

      console.error(error);

      const mensagem =
        firebaseErrors[
          error.code
        ] ||
        error.message ||
        "Usuário ou senha inválidos.";

      alert(mensagem);

      setLoading(false);
    }
  };