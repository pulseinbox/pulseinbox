/* =========================================================
   LEGAL PAGE COMPONENT
========================================================= */

export function LegalPage({
  title,
  subtitle = "",
  icon = "fa-file-contract",
  updatedAt = "",
  content = "",
}) {

  const section = document.createElement("main");

  section.className = "legal-page";

  section.innerHTML = `

    <div class="legal-page__background"></div>

    <div class="legal-page__container">

      <header class="legal-page__header">

        <a
          href="/"
          class="legal-page__back"
          data-route="/"
        >
          <i class="fa-solid fa-arrow-left"></i>
          <span>Volver a Pulse Inbox</span>
        </a>


        <div class="legal-page__icon">

          <i class="fa-solid ${icon}"></i>

        </div>


        <div class="legal-page__heading">

          <span class="legal-page__eyebrow">
            Pulse Inbox
          </span>

          <h1>
            ${title}
          </h1>

          ${
            subtitle
              ? `<p>${subtitle}</p>`
              : ""
          }

          ${
            updatedAt
              ? `
                <span class="legal-page__updated">
                  Última actualización: ${updatedAt}
                </span>
              `
              : ""
          }

        </div>

      </header>


      <article class="legal-page__content">

        ${content}

      </article>


      <footer class="legal-page__footer">

        <span>
          © ${new Date().getFullYear()} Pulse Inbox
        </span>

        <nav>

          <a
            href="/privacy"
            data-route="/privacy"
          >
            Privacidad
          </a>

          <a
            href="/terms"
            data-route="/terms"
          >
            Términos
          </a>

          <a
            href="/data-deletion"
            data-route="/data-deletion"
          >
            Eliminación de datos
          </a>

        </nav>

      </footer>

    </div>

  `;

  return section;
}