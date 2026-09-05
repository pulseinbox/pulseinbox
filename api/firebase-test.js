import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  const existingApps = getApps();

  const app =
    existingApps.length > 0
      ? existingApps[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });

  return getFirestore(app);
}

export default async function handler(req, res) {
  try {
    const adminDb = getAdminDb();

    const snapshot = await adminDb
      .collection("companies")
      .limit(1)
      .get();

    return res.status(200).json({
      success: true,
      firebaseAdmin: "connected",
      documentsFound: snapshot.size,
    });
  } catch (error) {
    console.error("FIREBASE ADMIN TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      firebaseAdmin: "error",
      message: error.message,
    });
  }
}