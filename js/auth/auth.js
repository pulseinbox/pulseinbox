import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";

import { firebaseApp } from "../firebase/firebase.js";


/* =========================================================
   FIREBASE
========================================================= */

export const auth =
  getAuth(firebaseApp);


export const db =
  getFirestore(firebaseApp);


/* =========================================================
   CURRENT USER
========================================================= */

let currentUser = null;


/* =========================================================
   AUTH READY
========================================================= */

let resolveAuthReady;

let authReadyResolved =
  false;


export const authReady =
  new Promise((resolve) => {

    resolveAuthReady =
      resolve;

  });


/* =========================================================
   BUILD USER PROFILE
========================================================= */

async function loadUserProfile(
  firebaseUser
) {

  if (!firebaseUser) {

    return null;

  }


  const employeeRef =
    doc(
      db,
      "employees",
      firebaseUser.uid
    );


  const employeeSnapshot =
    await getDoc(
      employeeRef
    );


  if (
    !employeeSnapshot.exists()
  ) {

    return null;

  }


  const employee =
    employeeSnapshot.data();


  /*
   * Verificamos que la cuenta
   * esté activa.
   */

  if (
    employee.active === false
  ) {

    return null;

  }


  return {

    id:
      firebaseUser.uid,

    uid:
      firebaseUser.uid,

    name:
      employee.name ?? "",

    email:
      employee.email ??
      firebaseUser.email,

    avatar:
      employee.avatar ?? null,

    role:
      employee.role ?? null,

    companies:
      Array.isArray(
        employee.companies
      )
        ? employee.companies
        : [],

  };

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (firebaseUser) => {

    /*
     * No existe sesión.
     */

    if (!firebaseUser) {

      currentUser =
        null;


      if (
        !authReadyResolved
      ) {

        authReadyResolved =
          true;

        resolveAuthReady(
          null
        );

      }


      return;

    }


    try {

      const user =
        await loadUserProfile(
          firebaseUser
        );


      /*
       * Firebase Auth tiene usuario,
       * pero no existe su perfil
       * dentro de employees.
       */

      if (!user) {

        currentUser =
          null;


        await signOut(
          auth
        );


        if (
          !authReadyResolved
        ) {

          authReadyResolved =
            true;

          resolveAuthReady(
            null
          );

        }


        return;

      }


      currentUser =
        user;


      if (
        !authReadyResolved
      ) {

        authReadyResolved =
          true;

        resolveAuthReady(
          currentUser
        );

      }

    } catch (error) {

      console.error(
        "Error cargando perfil de usuario:",
        error
      );


      currentUser =
        null;


      if (
        !authReadyResolved
      ) {

        authReadyResolved =
          true;

        resolveAuthReady(
          null
        );

      }

    }

  }
);


/* =========================================================
   GET CURRENT USER
========================================================= */

export function getCurrentUser() {

  return currentUser;

}


/* =========================================================
   IS AUTHENTICATED
========================================================= */

export function isAuthenticated() {

  return (
    currentUser !== null
  );

}


/* =========================================================
   LOGIN
========================================================= */

export async function login(
  email,
  password
) {

  /*
   * Firebase Authentication
   * valida las credenciales.
   */

  const credential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  /*
   * Una vez autenticado,
   * buscamos el perfil correspondiente
   * utilizando el UID.
   */

  const user =
    await loadUserProfile(
      credential.user
    );


  /*
   * Existe la cuenta en Firebase Auth
   * pero no existe el empleado en Firestore.
   */

  if (!user) {

    await signOut(
      auth
    );


    throw new Error(
      "USER_PROFILE_NOT_FOUND"
    );

  }


  /*
   * Actualizamos inmediatamente
   * el usuario actual.
   */

  currentUser =
    user;


  return user;

}


/* =========================================================
   LOGOUT
========================================================= */

export async function logout() {

  await signOut(
    auth
  );


  currentUser =
    null;

}