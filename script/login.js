// ===============================
// CONTROLE DE PERFIL
// ===============================

let role = null;

const lbl = document.getElementById('lbl-id');
const inp = document.getElementById('inp-id');

function selectRole(r) {
  role = r;

  // Alterna botão ativo
  document
    .getElementById('opt-professor')
    .classList.toggle('active', r === 'professor');

  document
    .getElementById('opt-aluno')
    .classList.toggle('active', r === 'aluno');

  // Remove mensagens de erro antigas
  clearError();

  // Configura campos conforme perfil
  if (r === 'professor') {
    lbl.textContent = 'E-mail Institucional';
    inp.placeholder = 'Ex: professor@educar.rs.gov.br';
    inp.type = 'email';
  } else {
    lbl.textContent = 'E-mail Institucional';
    inp.placeholder = 'Ex: aluno@estudante.rs.gov.br';
    inp.type = 'email';
  }
}

// ===============================
// LIMPAR ERRO
// ===============================

function clearError() {
  const campo = document.getElementById('inp-id');

  campo.style.borderColor = '';

  const msg = document.getElementById('msg-email-invalido');

  if (msg) {
    msg.remove();
  }
}

// ===============================
// MOSTRAR ERRO
// ===============================

function showError(message) {
  clearError();

  const campo = document.getElementById('inp-id');

  campo.style.borderColor = 'red';

  const msg = document.createElement('span');

  msg.id = 'msg-email-invalido';
  msg.textContent = message;

  msg.style.color = 'red';
  msg.style.fontSize = '13px';
  msg.style.marginTop = '5px';
  msg.style.display = 'block';

  campo.insertAdjacentElement('afterend', msg);
}

// ===============================
// LOGIN
// ===============================

function handleLogin() {

  // Verifica perfil
  if (!role) {
    alert('Selecione o perfil antes de continuar.');
    return;
  }

  const id = document
    .getElementById('inp-id')
    .value
    .trim();

  const senha = document
    .getElementById('inp-senha')
    .value
    .trim();

  // Verifica campos
  if (!id || !senha) {
    alert('Preencha todos os campos.');
    return;
  }

  // Remove erros anteriores
  clearError();

  // ===============================
  // VALIDAÇÃO PROFESSOR
  // ===============================

  if (
    role === 'professor' &&
    !id.includes('@educar')
  ) {
    showError(
      'Email inválido. O email do professor deve conter @educar.'
    );
    return;
  }

  // ===============================
  // VALIDAÇÃO ALUNO
  // ===============================

  if (
    role === 'aluno' &&
    !id.includes('@estudante')
  ) {
    showError(
      'Email inválido. O email do aluno deve conter @estudante.'
    );
    return;
  }

  // ===============================
  // BOTÃO
  // ===============================

  const btn = document.getElementById('btn-entrar');

  btn.textContent = 'Verificando...';
  btn.disabled = true;

  // ===============================
  // FIREBASE LOGIN
  // ===============================

  firebase
    .auth()
    .signInWithEmailAndPassword(id, senha)

    .then(() => {

      // Redireciona conforme perfil
      if (role === 'professor') {
        window.location.href = 'telaProfessor.html';
      }

      else if (role === 'aluno') {
        window.location.href = 'indexTelaAluno.html';
      }

    })

    .catch((error) => {

      let mensagem = 'Usuário ou senha inválidos.';

      switch (error.code) {

        case 'auth/user-not-found':
          mensagem =
            'Nenhum usuário encontrado com esse email.';
          break;

        case 'auth/wrong-password':
          mensagem = 'Senha incorreta.';
          break;

        case 'auth/invalid-email':
          mensagem = 'Formato de email inválido.';
          break;

        case 'auth/too-many-requests':
          mensagem =
            'Muitas tentativas. Tente novamente mais tarde.';
          break;

        default:
          mensagem = error.message;
      }

      alert(mensagem);

      btn.textContent = 'Entrar';
      btn.disabled = false;

    });
}