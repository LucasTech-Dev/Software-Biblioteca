 let role = null;

function selectRole(r) {
  role = r;

  document
    .getElementById('opt-professor')
    .classList.toggle('active', r === 'professor');

  document
    .getElementById('opt-aluno')
    .classList.toggle('active', r === 'aluno');

  const lbl = document.getElementById('lbl-id');
  const inp = document.getElementById('inp-id');

  if (r === 'professor') {
    lbl.textContent = 'E-mail Institucional';
    inp.placeholder = 'professor@escola.edu.br';
    inp.type = 'email';
  } else {
    lbl.textContent = 'Número de Matrícula';
    inp.placeholder = 'Ex: 2024001';
    inp.type = 'text';
  }
}

function handleLogin() {

  if (!role) {
    alert('Selecione o perfil antes de continuar.');
    return;
  }

  const id = document.getElementById('inp-id').value.trim();
  const senha = document.getElementById('inp-senha').value.trim();

  if (!id || !senha) {
    alert('Preencha todos os campos.');
    return;
  }

  const btn = document.getElementById('btn-entrar');

  btn.textContent = 'Verificando...';
  btn.disabled = true;

  setTimeout(() => {

    // LOGIN PROFESSOR
    if (role === 'professor' && id === 'adm123' && senha === '123') {

      window.location.href = "telaProfessor.html";

    }

    // LOGIN ALUNO
    else if (role === 'aluno' && id === 'aluno123' && senha === '123') {

      window.location.href = "indexTelaAluno.html";

    }

    // LOGIN INVÁLIDO
    else {

      alert('Usuário ou senha inválidos.');

      btn.textContent = 'Entrar';
      btn.disabled = false;

    }

  }, 1300);
}