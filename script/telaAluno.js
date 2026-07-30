function toggleCard(card) {
  card.classList.toggle('active');
}

import { signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";

document.getElementById("btnLogout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    // Redireciona mesmo se houver erro
    window.location.href = "login.html";
  }
});