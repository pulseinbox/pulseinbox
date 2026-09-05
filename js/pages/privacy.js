import { LegalPage } from "./legalPage.js";


/* =========================================================
   PRIVACY POLICY
========================================================= */

export function PrivacyPage() {

  return LegalPage({

    title: "Política de Privacidad",

    subtitle:
      "Información sobre cómo Pulse Inbox recopila, utiliza y protege los datos de sus usuarios.",

    icon:
      "fa-shield-halved",

    updatedAt:
      "4 de septiembre de 2026",

    content: `

      <section class="legal-section">

        <h2>1. Introducción</h2>

        <p>
          Pulse Inbox es una plataforma diseñada para ayudar a
          empresas y equipos a gestionar conversaciones y
          comunicaciones provenientes de diferentes canales
          digitales desde una interfaz centralizada.
        </p>

        <p>
          Esta Política de Privacidad explica qué información
          podemos recopilar, cómo la utilizamos y las medidas
          que aplicamos para protegerla.
        </p>

      </section>


      <section class="legal-section">

        <h2>2. Información que podemos recopilar</h2>

        <p>
          Dependiendo de las funciones utilizadas dentro de
          Pulse Inbox, podemos procesar información necesaria
          para proporcionar nuestros servicios.
        </p>

        <ul>

          <li>
            Información de la cuenta, como nombre y correo
            electrónico.
          </li>

          <li>
            Información necesaria para autenticar al usuario.
          </li>

          <li>
            Información relacionada con las páginas o cuentas
            que el usuario conecta voluntariamente.
          </li>

          <li>
            Mensajes y conversaciones recibidos a través de
            plataformas externas cuando el usuario autoriza
            dicha integración.
          </li>

          <li>
            Información técnica necesaria para operar,
            mantener y proteger el servicio.
          </li>

        </ul>

      </section>


      <section class="legal-section">

        <h2>3. Integraciones con plataformas externas</h2>

        <p>
          Pulse Inbox puede integrarse con plataformas de
          terceros, incluyendo servicios de Meta y otras
          plataformas de comunicación.
        </p>

        <p>
          Estas integraciones funcionan únicamente cuando el
          usuario proporciona las autorizaciones necesarias.
          Los datos obtenidos mediante dichas integraciones
          se procesan con el propósito de proporcionar las
          funciones solicitadas dentro de Pulse Inbox.
        </p>

      </section>


      <section class="legal-section">

        <h2>4. Uso de la información</h2>

        <p>
          La información procesada puede utilizarse para:
        </p>

        <ul>

          <li>
            Proporcionar las funciones principales de Pulse Inbox.
          </li>

          <li>
            Mostrar y organizar conversaciones.
          </li>

          <li>
            Mantener las integraciones autorizadas.
          </li>

          <li>
            Mejorar la seguridad y estabilidad de la plataforma.
          </li>

          <li>
            Detectar y prevenir usos no autorizados del servicio.
          </li>

        </ul>

      </section>


      <section class="legal-section">

        <h2>5. Protección de la información</h2>

        <p>
          Aplicamos medidas técnicas y organizativas razonables
          para proteger la información procesada por Pulse Inbox
          frente a accesos no autorizados, pérdida, alteración
          o divulgación indebida.
        </p>

        <p>
          Sin embargo, ningún sistema conectado a Internet puede
          garantizar una seguridad absoluta.
        </p>

      </section>


      <section class="legal-section">

        <h2>6. Compartición de información</h2>

        <p>
          Pulse Inbox no vende información personal de sus
          usuarios.
        </p>

        <p>
          La información podrá ser procesada por proveedores
          tecnológicos necesarios para operar determinadas
          funciones del servicio, siempre de acuerdo con las
          necesidades de la plataforma y las autorizaciones
          correspondientes.
        </p>

      </section>


      <section class="legal-section">

        <h2>7. Derechos del usuario</h2>

        <p>
          Dependiendo de la legislación aplicable, el usuario
          puede tener derechos relacionados con el acceso,
          corrección, eliminación o limitación del procesamiento
          de sus datos.
        </p>

        <p>
          Para solicitar información sobre sus datos o realizar
          una solicitud relacionada con privacidad, puede
          comunicarse con el equipo de Pulse Inbox.
        </p>

      </section>


      <section class="legal-section">

        <h2>8. Cambios a esta política</h2>

        <p>
          Pulse Inbox podrá actualizar esta Política de Privacidad
          cuando sea necesario para reflejar cambios en el
          servicio, requisitos legales o prácticas de procesamiento
          de información.
        </p>

      </section>


      <section class="legal-section">

        <h2>9. Contacto</h2>

        <p>
          Para consultas relacionadas con esta Política de
          Privacidad, puede comunicarse con:
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