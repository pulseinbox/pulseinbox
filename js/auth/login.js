import { employees } from "../mock-employees.js";
import { login } from "./auth.js";


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


  form.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      const password =
        passwordInput.value;


      const employee =
        employees.find(
          (user) =>
            user.email === email &&
            user.password === password
        );


      if (!employee) {

        error.textContent =
          "Correo o contraseña incorrectos.";

        passwordInput.value = "";

        passwordInput.focus();

        return;
      }


      error.textContent = "";


      /*
       * Guardamos únicamente la información
       * necesaria para identificar la sesión.
       *
       * La contraseña NO se guarda.
       */

      const sessionUser = {
        id: employee.id,
        name: employee.name,
        avatar: employee.avatar,
        role: employee.role,
        companies: employee.companies,
      };


      login(sessionUser);


      if (
        typeof onLogin ===
        "function"
      ) {
        onLogin(sessionUser);
      }

    }
  );


  return loginView;
}