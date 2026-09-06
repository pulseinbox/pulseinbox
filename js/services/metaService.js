import { getAuth } from "firebase/auth";
import { firebaseApp } from "../firebase/firebase.js";


/* =========================================================
   FACEBOOK MESSAGING
========================================================= */

export async function sendFacebookMessage(
  conversationId,
  text
) {
  if (
    !conversationId ||
    !text?.trim()
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  const auth =
    getAuth(firebaseApp);

  const firebaseUser =
    auth.currentUser;


  if (!firebaseUser) {
    return {
      success: false,
      reason:
        "user_not_authenticated",
    };
  }


  try {
    const idToken =
      await firebaseUser.getIdToken();


    const response =
      await fetch(
        "/api/meta/send-message",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },

          body: JSON.stringify({
            conversationId,
            text: text.trim(),
          }),
        }
      );


    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {
      console.error(
        "META SERVICE: error enviando mensaje:",
        {
          status:
            response.status,

          data,
        }
      );

      return {
        success: false,

        reason:
          data?.reason ||
          "meta_send_failed",

        status:
          response.status,

        error:
          data,
      };
    }


    return {
      success:
        data?.success === true,

      ...data,
    };

  } catch (error) {
    console.error(
      "META SERVICE: error de red:",
      error
    );

    return {
      success: false,

      reason:
        "network_error",

      error,
    };
  }
}


/* =========================================================
   FACEBOOK IMAGE MESSAGING
========================================================= */

export async function sendFacebookImage(
  conversationId,
  imageUrl,
  fileName = "image.jpg"
) {
  if (
    !conversationId ||
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  const auth =
    getAuth(firebaseApp);

  const firebaseUser =
    auth.currentUser;


  if (!firebaseUser) {
    return {
      success: false,
      reason:
        "user_not_authenticated",
    };
  }


  try {
    /*
     * Firebase genera un ID Token temporal.
     *
     * El token se envía al backend para que
     * Firebase Admin pueda verificar quién está
     * realizando el envío de la imagen.
     */

    const idToken =
      await firebaseUser.getIdToken();


    const response =
      await fetch(
        "/api/meta/send-image",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },

          body: JSON.stringify({
            conversationId,
            imageUrl,
            fileName,
          }),
        }
      );


    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {
      console.error(
        "META SERVICE: error enviando imagen:",
        {
          status:
            response.status,

          data,
        }
      );

      return {
        success: false,

        reason:
          data?.reason ||
          "meta_image_send_failed",

        status:
          response.status,

        error:
          data,
      };
    }


    return {
      success:
        data?.success === true,

      ...data,
    };

  } catch (error) {
    console.error(
      "META SERVICE: error de red enviando imagen:",
      error
    );

    return {
      success: false,

      reason:
        "network_error",

      error,
    };
  }
}
