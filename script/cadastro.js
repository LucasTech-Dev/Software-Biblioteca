 let roleAtual = null;

    function selectRole(role) {
      roleAtual = role;

      document
        .querySelectorAll('.role-opt')
        .forEach(el => el.classList.remove('active'));

      document
        .getElementById('opt-' + role)
        .classList.add('active');

      const lblId = document.getElementById('lbl-id');
      const lblExtra = document.getElementById('lbl-extra');
      const wrapTurma = document.getElementById('wrap-turma');
      const inpTurma = document.getElementById('inp-turma');

      if (role === 'professor') {

        lblId.textContent = 'Registro funcional';
        lblExtra.textContent = 'Disciplina';

        if (inpTurma.tagName === 'SELECT') {
          swapTurmaParaInput('Português, Matemática...');
        }

        wrapTurma.style.display = '';

      } else {

        lblId.textContent = 'Matrícula';
        lblExtra.textContent = 'Turma';

        if (document.getElementById('inp-turma').tagName === 'INPUT') {
          swapTurmaParaSelect();
        }

        wrapTurma.style.display = '';
      }
    }

    function swapTurmaParaInput(ph) {

      const wrap = document.querySelector('#wrap-turma .select-wrap');

      const input = document.createElement('input');

      input.type = 'text';
      input.id = 'inp-turma';
      input.placeholder = ph;

      wrap.replaceChild(
        input,
        document.getElementById('inp-turma')
      );
    }

    function swapTurmaParaSelect() {

      const wrap = document.querySelector('#wrap-turma .select-wrap');

      const sel = document.createElement('select');

      sel.id = 'inp-turma';

      [
        '',
        '1º A',
        '1º B',
        '2º A',
        '2º B',
        '3º A',
        '3º B'
      ].forEach(v => {

        const o = document.createElement('option');

        o.value = v;
        o.textContent = v || 'Selecione';

        sel.appendChild(o);
      });

      const old = document.getElementById('inp-turma');

      if (old) {
        wrap.replaceChild(sel, old);
      } else {
        wrap.appendChild(sel);
      }
    }

    function avaliarSenha(val) {

      const segs = [1, 2, 3, 4].map(i =>
        document.getElementById('seg' + i)
      );

      const lbl = document.getElementById('lbl-forca');

      const pontos = calcularForca(val);

      segs.forEach(s => {
        s.className = 'strength-seg';
      });

      if (!val) {
        lbl.textContent = '';
        return;
      }

      if (pontos <= 1) {

        segs[0].classList.add('fraca');

        lbl.style.color = '#C05050';
        lbl.textContent = 'Senha fraca';

      } else if (pontos === 2) {

        segs[0].classList.add('media');
        segs[1].classList.add('media');

        lbl.style.color = '#B09040';
        lbl.textContent = 'Senha razoável';

      } else if (pontos === 3) {

        [0, 1, 2].forEach(i => {
          segs[i].classList.add('forte');
        });

        lbl.style.color = '#4A8C6A';
        lbl.textContent = 'Senha boa';

      } else {

        segs.forEach(s => {
          s.classList.add('forte');
        });

        lbl.style.color = '#2E6B4A';
        lbl.textContent = 'Senha forte';
      }
    }

    function calcularForca(p) {

      let pts = 0;

      if (p.length >= 8) pts++;
      if (/[A-Z]/.test(p)) pts++;
      if (/[0-9]/.test(p)) pts++;
      if (/[^A-Za-z0-9]/.test(p)) pts++;

      return pts;
    }

    function handleCadastro() {

      const nome = document
        .getElementById('inp-nome')
        .value
        .trim();

      const id = document
        .getElementById('inp-id')
        .value
        .trim();

      const email = document
        .getElementById('inp-email')
        .value
        .trim();

      const senha = document
        .getElementById('inp-senha')
        .value;

      const confirma = document
        .getElementById('inp-confirma')
        .value;

      const fb = document.getElementById('msg-feedback');

      fb.className = 'msg';

      if (!roleAtual) {
        return mostrarErro('Selecione um perfil.');
      }

      if (!nome) {
        return mostrarErro('Informe o nome completo.');
      }

      if (!id) {
        return mostrarErro('Informe a identificação.');
      }

      if (!email || !email.includes('@')) {
        return mostrarErro('E-mail inválido.');
      }

      if (senha.length < 6) {
        return mostrarErro('A senha deve ter pelo menos 6 caracteres.');
      }

      if (senha !== confirma) {
        return mostrarErro('As senhas não coincidem.');
      }

      const btn = document.getElementById('btn-cadastrar');

      btn.disabled = true;
      btn.textContent = 'Cadastrando...';

      setTimeout(() => {

        btn.disabled = false;
        btn.textContent = 'Criar conta';

        mostrarOk('Conta criada com sucesso!');

        // window.location.href = 'login.html';

      }, 1400);
    }

    function mostrarErro(txt) {

      const fb = document.getElementById('msg-feedback');

      fb.className = 'msg erro';
      fb.textContent = txt;
    }

    function mostrarOk(txt) {

      const fb = document.getElementById('msg-feedback');

      fb.className = 'msg ok';
      fb.textContent = txt;
    }