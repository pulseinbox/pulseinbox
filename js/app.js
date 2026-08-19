import "@fortawesome/fontawesome-free/css/all.min.css";
import { AppShell } from "./components/appShell.js";
import { Login } from "./auth/login.js";
import {
  getCurrentUser,
} from "./auth/auth.js";


const root =
  document.querySelector("#app");


function renderApp() {
  root.innerHTML = "";

  root.appendChild(
    AppShell()
  );
}


function renderLogin() {
  root.innerHTML = "";

  root.appendChild(
    Login({
      onLogin: () => {
        renderApp();
      },
    })
  );
}


const currentUser =
  getCurrentUser();


if (currentUser) {
  renderApp();
} else {
  renderLogin();
}