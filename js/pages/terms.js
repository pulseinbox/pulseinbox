import { LegalPage } from "./legalPage.js";


/* =========================================================
   TERMS OF SERVICE
========================================================= */

export function TermsPage() {

  return LegalPage({

    title: "Términos de Servicio",

    subtitle:
      "Condiciones aplicables al uso de la plataforma Pulse Inbox.",

    icon:
      "fa-file-signature",

    updatedAt:
      "4 de septiembre de 2026",

    content: `

      <section class="legal-section">

        <h2>1. Aceptación de los términos</h2>

        <p>
          Al acceder o utilizar Pulse Inbox, el usuario acepta
          estos Términos de Servicio.
        </p>

        <p>
          Si el usuario no está de acuerdo con estos términos,
          deberá abstenerse de utilizar la plataforma.
        </p>

      </section>


      <section class="legal-section">

        <h2>2. Descripción del servicio</h2>

        <p>
          Pulse Inbox proporciona herramientas destinadas a
          centralizar y gestionar comunicaciones provenientes
          de diferentes plataformas digitales.
        </p>

        <p>
          Las funcionalidades disponibles pueden cambiar,
          ampliarse o modificarse con el tiempo.
        </p>

      </section>


      <section class="legal-section">

        <h2>3. Cuenta del usuario</h2>

        <p>
          El usuario es responsable de mantener la seguridad de
          sus credenciales y de toda actividad realizada desde
          su cuenta.
        </p>

        <p>
          El usuario deberá proporcionar información precisa
          cuando sea necesaria para utilizar el servicio.
        </p>

      </section>


      <section class="legal-section">

        <h2>4. Integraciones con terceros</h2>

        <p>
          Algunas funcionalidades de Pulse Inbox dependen de
          plataformas externas.
        </p>

        <p>
          El uso de dichas plataformas también está sujeto a
          sus propios términos, políticas y condiciones.
        </p>

        <p>
          Pulse Inbox no controla las políticas, disponibilidad
          o cambios realizados por servicios externos.
        </p>

      </section>


      <section class="legal-section">

        <h2>5. Uso permitido</h2>

        <p>
          El usuario se compromete a utilizar Pulse Inbox de
          manera legal y de acuerdo con estos términos.
        </p>

        <p>
          No está permitido utilizar la plataforma para
          actividades fraudulentas, ilegales, abusivas o que
          puedan afectar la seguridad o funcionamiento del
          servicio.
        </p>

      </section>


      <section class="legal-section">

        <h2>6. Disponibilidad del servicio</h2>

        <p>
          Pulse Inbox busca mantener el servicio disponible,
          pero no garantiza que la plataforma permanezca libre
          de interrupciones, errores o períodos de mantenimiento.
        </p>

      </section>


      <section class="legal-section">

        <h2>7. Propiedad intelectual</h2>

        <p>
          Los elementos propios de Pulse Inbox, incluyendo su
          software, interfaz, diseño, identidad visual y
          contenido original, pertenecen a sus respectivos
          titulares y están protegidos por las leyes aplicables.
        </p>

      </section>


      <section class="legal-section">

        <h2>8. Terminación</h2>

        <p>
          El acceso a Pulse Inbox podrá ser suspendido o
          terminado cuando exista un incumplimiento de estos
          términos o cuando resulte necesario para proteger
          la seguridad y funcionamiento del servicio.
        </p>

      </section>


      <section class="legal-section">

        <h2>9. Modificaciones</h2>

        <p>
          Estos Términos de Servicio pueden actualizarse cuando
          sea necesario. La versión publicada en esta página
          será la versión vigente.
        </p>

      </section>


      <section class="legal-section">

        <h2>10. Contacto</h2>

        <p>
          Para consultas relacionadas con estos términos:
        </p>

        <p>
          <strong>Pulse Inbox</strong><br>
          Correo electrónico:
          <a href="mailto:legal@pulseinbox.vercel.app">
            legal@pulseinbox.vercel.app
          </a>
        </p>

      </section>

    `,

  });

}