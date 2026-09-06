import crypto from "node:crypto";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";


/*
 * =========================================================
 * FIREBASE ADMIN
 * =========================================================
 */

function getAdminApp() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin no está configurado."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}


const adminApp =
  getAdminApp();

const adminAuth =
  getAuth(adminApp);

const adminDb =
  getFirestore(adminApp);


/*
 * =========================================================
 * IMAGEKIT
 * =========================================================
 */

const IMAGEKIT_PUBLIC_KEY =
  process.env.IMAGEKIT_PUBLIC_KEY;

const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY;


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getBearerToken(req) {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  return authorization.substring(
    "Bearer ".length
  );
}


/*
 * =========================================================
 * HANDLER
 * =========================================================
 */

export default async function handler(
  req,
  res
) {
  console.log(
    "IMAGEKIT AUTH:",
    req.method
  );


  /*
   * =======================================================
   * METHOD
   * =======================================================
   */

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        success: false,
        reason: "method_not_allowed",
      });
  }


  try {
    /*
     * =====================================================
     * VALIDAR IMAGEKIT
     * =====================================================
     */

    if (
      !IMAGEKIT_PUBLIC_KEY ||
      !IMAGEKIT_PRIVATE_KEY
    ) {
      console.error(
        "IMAGEKIT AUTH: faltan variables de entorno"
      );

      return res
        .status(500)
        .json({
          success: false,
          reason:
            "imagekit_not_configured",
        });
    }


    /*
     * =====================================================
     * AUTENTICACIÓN FIREBASE
     * =====================================================
     */

    const idToken =
      getBearerToken(req);

    if (!idToken) {
      return res
        .status(401)
        .json({
          success: false,
          reason:
            "missing_authentication",
        });
    }


    let decodedToken;

    try {
      decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );
    } catch (error) {
      console.error(
        "IMAGEKIT AUTH: token Firebase inválido:",
        error.message
      );

      return res
        .status(401)
        .json({
          success: false,
          reason:
            "invalid_authentication",
        });
    }


    const employeeUid =
      decodedToken.uid;


    /*
     * =====================================================
     * EMPLEADO
     * =====================================================
     */

    const employeeSnapshot =
      await adminDb
        .collection("employees")
        .doc(employeeUid)
        .get();


    if (
      !employeeSnapshot.exists
    ) {
      console.warn(
        "IMAGEKIT AUTH: empleado no encontrado:",
        employeeUid
      );

      return res
        .status(403)
        .json({
          success: false,
          reason:
            "employee_not_found",
        });
    }


    const employee =
      employeeSnapshot.data() || {};


    /*
     * =====================================================
     * EMPLEADO ACTIVO
     * =====================================================
     */

    if (
      employee.active === false
    ) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "employee_inactive",
        });
    }


    /*
     * =====================================================
     * PERMISO DE RESPUESTA
     * =====================================================
     *
     * Solo usuarios que pueden responder conversaciones
     * pueden solicitar credenciales para subir multimedia.
     */

    const allowedRoles = [
      "admin",
      "manager",
      "agent",
    ];

    if (
      !allowedRoles.includes(
        employee.role
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "reply_permission_required",
        });
    }


    /*
     * =====================================================
     * GENERAR CREDENCIALES IMAGEKIT
     * =====================================================
     *
     * ImageKit requiere:
     * token + expire + signature.
     *
     * La firma HMAC-SHA1 se genera exclusivamente
     * en el servidor usando la Private Key.
     */

    const token =
      crypto.randomUUID();

    const expire =
      Math.floor(Date.now() / 1000) +
      15 * 60;

    const signature =
      crypto
        .createHmac(
          "sha1",
          IMAGEKIT_PRIVATE_KEY
        )
        .update(
          `${token}${expire}`
        )
        .digest("hex");


    console.log(
      "IMAGEKIT AUTH: credenciales generadas para:",
      employeeUid
    );


    return res
      .status(200)
      .json({
        success: true,
        token,
        expire,
        signature,
        publicKey:
          IMAGEKIT_PUBLIC_KEY,
      });

  } catch (error) {
    console.error(
      "IMAGEKIT AUTH: error interno:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        reason:
          "internal_server_error",
      });
  }
}
