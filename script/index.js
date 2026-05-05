 function toggleCard(card) {
   const isActive = card.classList.contains('active');
   document.querySelectorAll('.module-card').forEach(c => c.classList.remove('active'));
   if (!isActive) card.classList.add('active');
<<<<<<< HEAD
 } 
=======
 }  
>>>>>>> 504ec5506d7a012ccc8f074a66ace9254bb37751