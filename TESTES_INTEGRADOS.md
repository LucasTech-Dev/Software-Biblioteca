# Roteiro de Testes Integrados

## Objetivo
Validar os fluxos principais do sistema após a consolidação dos services.

## Fluxo 1 — Reserva
- [ ] Fazer login como aluno.
- [ ] Acessar a tela de acervo/busca.
- [ ] Reservar um livro disponível.
- [ ] Confirmar se a reserva foi criada no Firestore.
- [ ] Confirmar se o professor visualiza a reserva pendente.
- [ ] Confirmar se o status do livro mudou para reservado.
- [ ] Confirmar se o aluno vê a reserva em "Em análise".

## Fluxo 2 — Aprovação
- [ ] Logar como professor.
- [ ] Abrir a aba de reservas pendentes.
- [ ] Aprovar uma reserva.
- [ ] Informar datas de retirada e entrega.
- [ ] Confirmar que a reserva some da lista.
- [ ] Confirmar que um empréstimo foi criado.
- [ ] Confirmar que a quantidade disponível do livro foi atualizada.
- [ ] Confirmar que o aluno recebe notificação de aprovação.
- [ ] Confirmar que o livro aparece em "Minhas Retiradas".

## Fluxo 3 — Negação
- [ ] Criar uma nova reserva.
- [ ] Negar a reserva pelo professor.
- [ ] Confirmar que a reserva deixou de aparecer para o professor.
- [ ] Confirmar que o livro voltou ao estado disponível.
- [ ] Confirmar que o aluno recebeu notificação de recusa.

## Fluxo 4 — Devolução
- [ ] Registrar a devolução de um empréstimo.
- [ ] Confirmar que o livro voltou ao estoque.
- [ ] Confirmar que o empréstimo passou para "Devolvido".
- [ ] Confirmar que o histórico foi atualizado.
- [ ] Confirmar que o aluno recebe notificação de devolução.

## Fluxo 5 — Atrasos
- [ ] Criar um empréstimo com prazo vencido.
- [ ] Confirmar que o professor vê o item na aba de atrasados.
- [ ] Confirmar que o aluno vê o item na aba de atrasados.
- [ ] Confirmar se a notificação de atraso foi disparada.

## Fluxo 6 — Ocultar registros
- [ ] Ocultar uma reserva no perfil do aluno.
- [ ] Ocultar um empréstimo no perfil do aluno.
- [ ] Confirmar que os documentos continuam no Firestore.
- [ ] Confirmar que apenas a visualização foi alterada.

## Observações
- Revisar mensagens de erro e feedback visual.
- Validar se os status aparecem corretamente nas telas.
- Confirmar que o fluxo funciona tanto para aluno quanto para professor.
