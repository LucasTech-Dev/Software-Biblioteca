import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { app } from "./config.js";

const db = getFirestore(app);

export { db };