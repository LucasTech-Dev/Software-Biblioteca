// script.js — sem import/export, Firebase já está global via compat

let perfilSelecionado = "professor";

document.addEventListener("DOMContentLoaded", () => {
    const professorBtn = document.getElementById("opt-professor");
    const alunoBtn = document.getElementById("opt-aluno");

    professorBtn?.addEventListener("click", () => selectRole("professor"));
    alunoBtn?.addEventListener("click", () => selectRole("aluno"));

    // Inicializa na tela
    selectRole("professor");
});

function selectRole(role) {
    perfilSelecionado = role;

    const professorBtn = document.getElementById("opt-professor");
    const alunoBtn = document.getElementById("opt-aluno");

    if (professorBtn) professorBtn.classList.toggle("active", role === "professor");
    if (alunoBtn) alunoBtn.classList.toggle("active", role === "aluno");

    atualizarInterface();
}

function atualizarInterface() {
    const emailInput = document.getElementById("inp-id");
    const helper = document.querySelector(".email-helper");
    const erroMsg = document.getElementById("email-error");

    if (emailInput && helper) {
        if (perfilSelecionado === "professor") {
            emailInput.placeholder = "nome@educar.rs.gov.br";
            helper.textContent = "Use seu e-mail institucional (Ex: nome@educar.rs.gov.br)";
        } else {
            emailInput.placeholder = "nome@estudante.rs.gov.br";
            helper.textContent = "Use seu e-mail institucional (Ex: nome@estudante.rs.gov.br)";
        }
    }

    if (emailInput) emailInput.classList.remove("input-error");
    if (erroMsg) erroMsg.style.display = "none";
}

function togglePassword() {
    const senhaInput = document.getElementById("senha");
    const eye = document.getElementById("eye");
    if (!senhaInput || !eye) return;

    if (senhaInput.type === "password") {
        senhaInput.type = "text";
        eye.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        senhaInput.type = "password";
        eye.classList.replace("fa-eye-slash", "fa-eye");
    }
}

async function handleLogin() {
    const emailInput = document.getElementById("inp-id");
    const senhaInput = document.getElementById("senha");
    const submitBtn = document.querySelector(".btn-submit");
    const erroMsg = document.getElementById("email-error");

    function mostrarErroLocal(m) {
        emailInput.classList.add("input-error");
        if (erroMsg) {
            erroMsg.textContent = m;
            erroMsg.style.display = "block";
        }
    }

    const email = emailInput?.value.trim();
    const senha = senhaInput?.value.trim();

    if (!email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    const dominio = email.split("@")[1]?.toLowerCase();
    if (perfilSelecionado === "professor" && dominio !== "educar.rs.gov.br") {
        mostrarErroLocal("Professores devem utilizar @educar.rs.gov.br");
        return;
    }
    if (perfilSelecionado === "aluno" && dominio !== "estudante.rs.gov.br") {
        mostrarErroLocal("Alunos devem utilizar @estudante.rs.gov.br");
        return;
    }

    if (submitBtn) {
        submitBtn.textContent = "Verificando...";
        submitBtn.disabled = true;
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(email, senha);
        window.location.href = (perfilSelecionado === "professor")
            ? "telaProfessor.html"
            : "indexTelaAluno.html";
    } catch (error) {
        console.error("Erro:", error.code);
        alert("E-mail ou senha incorretos.");
        if (submitBtn) {
            submitBtn.textContent = "Entrar";
            submitBtn.disabled = false;
        }
    }
}