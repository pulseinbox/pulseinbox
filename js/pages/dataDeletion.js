import { LegalPage } from "./legalPage.js";


/* =========================================================
   DATA DELETION
========================================================= */

export function DataDeletionPage() {

  return LegalPage({

    title: "Eliminación de Datos",

    subtitle:
      "Información sobre cómo solicitar la eliminación de los datos asociados a Pulse Inbox.",

    icon:
      "fa-trash-can",

    updatedAt:
      "4 de septiembre de 2026",

    content: `

      <section class="legal-section">

        <h2>1. Solicitud de eliminación</h2>

        <p>
          Los usuarios pueden solicitar la eliminación de los
          datos asociados con su cuenta y con las integraciones
          conectadas a Pulse Inbox.
        </p>

      </section>


      <section class="legal-section">

        <h2>2. Cómo solicitar la eliminación</h2>

        <p>
          Para solicitar la eliminación de sus datos, envíe una
          solicitud al correo electrónico indicado a continuación.
        </p>

        <div class="legal-action">

          <i class="fa-solid fa-envelope"></i>

          <div>

            <strong>
              Solicitar eliminación de datos
            </strong>

            <span>
              Envíe su solicitud a:
            </span>

            <a
              href="mailto:privacy@pulseinbox.vercel.app"
            >
              privacy@pulseinbox.vercel.app
            </a>

          </div>

        </div>

      </section>


      <section class="legal-section">

        <h2>3. Información que debe incluir</h2>

        <p>
          Para poder procesar correctamente la solicitud,
          recomendamos incluir:
        </p>

        <ul>

          <li>
            Nombre asociado a la cuenta.
          </li>

          <li>
            Correo electrónico utilizado para acceder a
            Pulse Inbox.
          </li>

          <li>
            Plataforma o página conectada, cuando corresponda.
          </li>

          <li>
            Una descripción de la solicitud.
          </li>

        </ul>

      </section>


      <section class="legal-section">

        <h2>4. Procesamiento de la solicitud</h2>

        <p>
          Una vez recibida la solicitud, se verificará que
          corresponda al titular o administrador autorizado
          de la cuenta antes de proceder con la eliminación.
        </p>

        <p>
          Algunos datos podrán conservarse cuando exista una
          obligación legal o una razón legítima para hacerlo.
        </p>

      </section>


      <section class="legal-section">

        <h2>5. Desconectar una integración</h2>

        <p>
          El usuario también puede solicitar la desconexión
          de una plataforma externa integrada con Pulse Inbox.
        </p>

        <p>
          La desconexión de una integración no necesariamente
          elimina automáticamente todos los datos que ya hayan
          sido almacenados, por lo que puede ser necesario
          realizar una solicitud específica de eliminación.
        </p>

      </section>


      <section class="legal-section">

        <h2>6. Contacto</h2>

        <p>
          Para solicitudes relacionadas con la eliminación
          de datos:
        </p>

        <p>
          <strong>Pulse Inbox</strong><br>
          Correo electrónico:
          <a href="mailto:privacy@pulseinbox.vercel.app">
            privacy@pulseinbox.vercel.app
          </a>
        </p>

      </section>

    `,

  });

}