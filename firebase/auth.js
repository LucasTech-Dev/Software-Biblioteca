import { getAuth }

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { app } from "./config.js";


const auth = getAuth(app);

export { auth };  