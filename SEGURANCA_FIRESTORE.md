# Checklist de Segurança do Firestore

## Prioridades
1. Publicar as regras em [firestore.rules](firestore.rules).
2. Publicar os índices em [firestore.indexes.json](firestore.indexes.json).
3. Validar com o Firebase Emulator ou console.
4. Testar cada papel (aluno/professor) antes de produção.

## Pendência obrigatória antes da publicação

O formulário atual permite que uma pessoa escolha o perfil `professor` no cadastro. As regras impedem que um perfil já criado seja alterado pelo próprio usuário, mas não podem decidir quem está autorizado a criar o primeiro perfil de professor. Antes da publicação pública, defina um fluxo institucional de aprovação/provisionamento de professores (por exemplo, convite administrativo ou função backend). Não é seguro abrir o cadastro de professor sem essa decisão.

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
