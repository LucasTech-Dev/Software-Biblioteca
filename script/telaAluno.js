// ========================================
// IMPORTS (Sempre no topo do arquivo)
// ========================================
import { signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";

// ========================================
// FUNÇÕES DE INTERFACE
// ========================================
// Exposta no escopo do window para funcionar com onclick="" no HTML
function toggleCard(card) {
  card?.classList.toggle('active');
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
    // Redireciona para o login mesmo em caso de erro na sessão
    window.location.href = "login.html";
  }
});