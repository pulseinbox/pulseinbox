export default async function handler(req, res) {

  console.log(
    "META WEBHOOK:",
    req.method
  );


  /* =====================================================
     META WEBHOOK VERIFICATION
  ===================================================== */

  if (req.method === "GET") {

    const mode =
      req.query?.["hub.mode"];

    const token =
      req.query?.["hub.verify_token"];

    const challenge =
      req.query?.["hub.challenge"];

    const verifyToken =
      process.env.META_VERIFY_TOKEN;


    console.log(
      "META WEBHOOK DEBUG:",
      {
        mode,
        tokenReceived:
          Boolean(token),
        challengeReceived:
          Boolean(challenge),
        envConfigured:
          Boolean(verifyToken),

        tokenLength:
          token?.length ?? 0,

        envLength:
          verifyToken?.length ?? 0,

        tokensMatch:
          Boolean(
            token &&
            verifyToken &&
            token === verifyToken
          ),
      }
    );


    if (!verifyToken) {

      console.error(
        "META WEBHOOK: META_VERIFY_TOKEN no está configurado"
      );

      return res
        .status(500)
        .send(
          "META_VERIFY_TOKEN_NOT_CONFIGURED"
        );

    }


    if (
      mode === "subscribe" &&
      token === verifyToken
    ) {

      console.log(
        "META WEBHOOK: verificación correcta"
      );

      return res
        .status(200)
        .send(challenge);

    }


    console.warn(
      "META WEBHOOK: token incorrecto"
    );

    return res
      .status(403)
      .send("Forbidden");

  }


  /* =====================================================
     META EVENTS
  ===================================================== */

  if (req.method === "POST") {

    console.log(
      "META WEBHOOK: evento recibido"
    );

    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    return res
      .status(200)
      .send("EVENT_RECEIVED");

  }


  /* =====================================================
     METHOD NOT ALLOWED
  ===================================================== */

  return res
    .status(405)
    .send("Method Not Allowed");

}