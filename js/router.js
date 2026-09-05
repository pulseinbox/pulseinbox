/* =========================================================
   ROUTER
========================================================= */

const routes = {

  "/privacy": async () => {

    const module =
      await import("./pages/privacy.js");

    return module.PrivacyPage;

  },


  "/terms": async () => {

    const module =
      await import("./pages/terms.js");

    return module.TermsPage;

  },


  "/data-deletion": async () => {

    const module =
      await import("./pages/dataDeletion.js");

    return module.DataDeletionPage;

  },

};


/* =========================================================
   NAVIGATE
========================================================= */

export async function navigate(path) {

  const route =
    routes[path];

  if (!route) {

    return false;

  }


  try {

    const renderPage =
      await route();


    if (
      typeof renderPage !==
      "function"
    ) {

      console.error(
        `La ruta "${path}" no tiene una función de render válida.`
      );

      return false;

    }


    const root =
      document.querySelector(
        "#app"
      );


    if (!root) {

      console.error(
        "No se encontró #app."
      );

      return false;

    }


    root.innerHTML = "";


    root.appendChild(
      renderPage()
    );


    return true;

  } catch (error) {

    console.error(
      `Error cargando la ruta "${path}":`,
      error
    );

    return false;

  }

}


/* =========================================================
   CURRENT PATH
========================================================= */

export function getCurrentPath() {

  return (
    window.location.pathname
      .replace(/\/+$/, "") ||
    "/"
  );

}


/* =========================================================
   LINK HANDLING
========================================================= */

export function initializeRouter() {

  document.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest(
          "[data-route]"
        );


      if (!link) {

        return;

      }


      const path =
        link.dataset.route;


      if (!routes[path]) {

        return;

      }


      event.preventDefault();


      window.history.pushState(
        {},
        "",
        path
      );


      navigate(path);

    }
  );


  window.addEventListener(
    "popstate",
    () => {

      navigate(
        getCurrentPath()
      );

    }
  );

}