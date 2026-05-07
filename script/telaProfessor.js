function toggleCard(card) {
   const isActive = card.classList.contains('active');
   document.querySelectorAll('.module-card').forEach(c => c.classList.remove('active'));
   if (!isActive) card.classList.add('active');

 } 

 