import { adminDb } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
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