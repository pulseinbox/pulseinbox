import {
  login,
} from "./auth.js";


export function Login({
  onLogin,
}) {

  const loginView =
    document.createElement("main");


  loginView.className =
    "login";


  loginView.innerHTML = `
    <div class="login-card">

      <div class="login-brand">

        <div class="login-logo">
          P
        </div>

        <div>
          <h1>Pulse</h1>

          <p>
            Centro de operaciones
          </p>
        </div>

      </div>


      <form class="login-form">

        <div class="login-field">

          <label for="login-email">
            Correo electrónico
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="correo@pulse.local"
            autocomplete="username"
            required
          />

        </div>


        <div class="login-field">

          <label for="login-password">
            Contraseña
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />

        </div>


        <p
          class="login-error"
          aria-live="polite"
        ></p>


        <button
          type="submit"
          class="login-submit"
        >
          Entrar
        </button>

      </form>

    </div>
  `;


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const form =
    loginView.querySelector(
      ".login-form"
    );


  const emailInput =
    loginView.querySelector(
      "#login-email"
    );


  const passwordInput =
    loginView.querySelector(
      "#login-password"
    );


  const error =
    loginView.querySelector(
      ".login-error"
    );


  const submitButton =
    loginView.querySelector(
      ".login-submit"
    );


  /* =======================================================
     SUBMIT
  ======================================================= */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


      error.textContent =
        "";


      submitButton.disabled =
        true;


      submitButton.textContent =
        "Entrando...";


      try {

        const user =
          await login(
            email,
            password
          );


        passwordInput.value =
          "";


        if (
          typeof onLogin ===
          "function"
        ) {

          onLogin(
            user
          );

        }


      } catch (errorObject) {

        console.error(
          errorObject
        );


        error.textContent =
          getLoginErrorMessage(
            errorObject
          );


        passwordInput.value =
          "";


        passwordInput.focus();


      } finally {

        submitButton.disabled =
          false;


        submitButton.textContent =
          "Entrar";

      }

    }
  );


  return loginView;
}


/* =========================================================
   FIREBASE LOGIN ERRORS
========================================================= */

function getLoginErrorMessage(
  error
) {

  switch (
    error?.code
  ) {

    case "auth/invalid-credential":

    case "auth/invalid-login-credentials":

    case "auth/wrong-password":

    case "auth/user-not-found":

      return (
        "Correo o contraseña incorrectos."
      );


    case "auth/too-many-requests":

      return (
        "Demasiados intentos. Intenta nuevamente más tarde."
      );


    case "auth/user-disabled":

      return (
        "Esta cuenta está deshabilitada."
      );


    case "auth/invalid-email":

      return (
        "El correo electrónico no es válido."
      );


    default:

      if (
        error?.message ===
        "USER_PROFILE_NOT_FOUND"
      ) {

        return (
          "La cuenta no tiene un perfil de Pulse."
        );

      }


      return (
        "No se pudo iniciar sesión. Intenta nuevamente."
      );
  }
}