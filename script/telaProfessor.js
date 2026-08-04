// ========================================
// IMPORTS (Sempre no topo do arquivo)
// ========================================
import { signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";

// ========================================
// FUNÇÕES DE INTERFACE
// ========================================
function toggleCard(card) {
  const isActive = card.classList.contains('active');

  document.querySelectorAll('.module-card').forEach((c) => {
    c.classList.remove('active');
  });

  if (!isActive) {
    card.classList.add('active');
  }
}

window.toggleCard = toggleCard;

// ========================================
// LOGOUT
// ========================================
document.getElementById("btnLogout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    window.location.href = "login.html";
  }
});