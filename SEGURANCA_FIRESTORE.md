# Checklist de Segurança do Firestore

## Prioridades
1. Publicar as regras em [firestore.rules](firestore.rules).
2. Validar com o Firebase Emulator ou console.
3. Testar cada papel (aluno/professor) antes de produção.

## Regras a revisar
- [ ] Alunos não podem alterar empréstimos.
- [ ] Alunos não podem aprovar reservas.
- [ ] Alunos não podem alterar quantidade de livros no acervo.
- [ ] Alunos só podem ler o próprio histórico.
- [ ] Professores podem gerenciar reservas e empréstimos.
- [ ] Leitura de acervo é permitida para usuários autenticados.
- [ ] Escritas sensíveis são restritas a professores ou ao próprio usuário.

## Testes recomendados
- [ ] Aluno tenta criar/alterar um empréstimo e a operação é negada.
- [ ] Aluno tenta aprovar uma reserva e a operação é negada.
- [ ] Professor altera status de reserva e a operação é permitida.
- [ ] Aluno lê apenas seus próprios dados e notificações.
