function toggleCard(card) {
  // Verifica se o card clicado já está ativo
  const isActive = card.classList.contains('active');

  // Remove a classe active de todos os cards
  document.querySelectorAll('.module-card').forEach((c) => {
    c.classList.remove('active');
  });

  // Ativa apenas o card clicado, se ele não estava ativo
  if (!isActive) {
    card.classList.add('active');
  }
}