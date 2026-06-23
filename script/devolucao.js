
    const registrarBtn =
      document.getElementById("registrarBtn");

    registrarBtn.addEventListener("click", () => {

      const devolucao = {

        aluno:
          document.getElementById("aluno").value,

        matricula:
          document.getElementById("matricula").value,

        livro:
          document.getElementById("livro").value,

        retirada:
          document.getElementById("retirada").value,

        devolucao:
          document.getElementById("devolucao").value,

        status:
          document.getElementById("status").value

      };

      // VALIDAÇÃO

      if (
        devolucao.aluno.trim() === "" ||
        devolucao.livro.trim() === ""
      ) {

        window.showAppMessage?.(
          "Preencha os campos obrigatórios."
        );

        return;

      }

      // SALVA

      localStorage.setItem(
        "ultimaDevolucao",
        JSON.stringify(devolucao)
      );

      // ALERTA

      window.showAppMessage?.(
        "Devolução registrada com sucesso!"
      );

      // REDIRECIONA

      window.location.href =
        "./emprestimos.html";

    });