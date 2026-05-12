let role = null;


function selectRole(r) {
 role = r;
 document
   .getElementById('opt-professor')
   .classList.toggle('active', r === 'professor');


 document
   .getElementById('opt-aluno')
   .classList.toggle('active', r === 'aluno');


  if (r === 'professor') {
    lbl.textContent = 'E-mail Institucional';
    inp.placeholder = 'Ex: professor@educar.rs.gov.br';
    inp.type = 'email';
  } else {
    lbl.textContent = 'E-mail Institucional';
    inp.placeholder = 'Ex: Aluno@estudante.rs.gov.br';
    inp.type = 'text';
  }
}
 


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

// Validação de email por perfil
if (role === 'professor' && !id.includes('@educar')) {
  const campo = document.getElementById('inp-id');
  campo.style.borderColor = 'red';

  const msgAnterior = document.getElementById('msg-email-invalido');
  if (msgAnterior) msgAnterior.remove();

  const msg = document.createElement('span');
  msg.id = 'msg-email-invalido';
  msg.textContent = 'Email inválido. O email do professor deve conter @educar.';
  msg.style.color = 'red';
  msg.style.fontSize = '13px';
  campo.insertAdjacentElement('afterend', msg);
  return;
}

if (role === 'aluno' && !id.includes('@estudante')) {
  const campo = document.getElementById('inp-id');
  campo.style.borderColor = 'red';

  const msgAnterior = document.getElementById('msg-email-invalido');
  if (msgAnterior) msgAnterior.remove();

  const msg = document.createElement('span');
  msg.id = 'msg-email-invalido';
  msg.textContent = 'Email inválido. O email do aluno deve conter @estudante.';
  msg.style.color = 'red';
  msg.style.fontSize = '13px';
  campo.insertAdjacentElement('afterend', msg);
  return;
}

// Limpa erro de email caso esteja válido
const msgAnterior = document.getElementById('msg-email-invalido');
if (msgAnterior) msgAnterior.remove();
document.getElementById('inp-id').style.borderColor = '';

const btn = document.getElementById('btn-entrar');
btn.textContent = 'Verificando...';
btn.disabled = true;

// Autenticação real no Firebase
firebase.auth()
  .signInWithEmailAndPassword(id, senha)
  .then(response => {
    // Login bem-sucedido — redireciona conforme o perfil
    if (role === 'professor') {
      window.location.href = "telaProfessor.html";
    } else if (role === 'aluno') {
      window.location.href = "indexTelaAluno.html";
    }
  })
  .catch(error => {
    // Trata os erros mais comuns do Firebase
    let mensagem = 'Usuário ou senha inválidos.';

    if (error.code === 'auth/user-not-found') {
      mensagem = 'Nenhum usuário encontrado com esse email.';
    } else if (error.code === 'auth/wrong-password') {
      mensagem = 'Senha incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      mensagem = 'Formato de email inválido.';
    } else if (error.code === 'auth/too-many-requests') {
      mensagem = 'Muitas tentativas. Tente novamente mais tarde.';
    }

    alert(mensagem);
    btn.textContent = 'Entrar';
    btn.disabled = false;
  });
}


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



