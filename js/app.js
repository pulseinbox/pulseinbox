import "@fortawesome/fontawesome-free/css/all.min.css";

import { AppShell } from "./components/appShell.js";

import { Login } from "./auth/login.js";

import {
  getCurrentUser,
  authReady,
} from "./auth/auth.js";


/* =========================================================
   ROOT
========================================================= */

const root =
  document.querySelector("#app");


/* =========================================================
   RENDER APP
========================================================= */

function renderApp() {

  console.log(
    "renderApp() ejecutándose"
  );

  root.innerHTML = "";


  console.log(
    "Creando AppShell..."
  );


  const appShell =
    AppShell();


  console.log(
    "AppShell creado:",
    appShell
  );


  root.appendChild(
    appShell
  );


  console.log(
    "AppShell agregado al DOM"
  );

}


/* =========================================================
   RENDER LOGIN
========================================================= */

function renderLogin() {

  root.innerHTML = "";


  root.appendChild(
    Login({

      onLogin: () => {

        console.log(
          "LOGIN CORRECTO"
        );


        console.log(
          "Renderizando AppShell..."
        );


        renderApp();

      },

    })
  );

}


/* =========================================================
   INITIAL AUTH STATE
========================================================= */

async function initializeApp() {

  /*
   * Esperamos a que Firebase determine
   * si existe una sesión activa.
   */

  await authReady;


  const currentUser =
    getCurrentUser();


  console.log(
    "Usuario actual:",
    currentUser
  );


  if (currentUser) {

    renderApp();

  } else {

    renderLogin();

  }

}


/* =========================================================
   START
========================================================= */

initializeApp();