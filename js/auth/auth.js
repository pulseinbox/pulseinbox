const AUTH_STORAGE_KEY =
  "pulse_session";


export function getCurrentUser() {
  const session =
    localStorage.getItem(
      AUTH_STORAGE_KEY
    );

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session);
  } catch {
    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    return null;
  }
}


export function isAuthenticated() {
  return getCurrentUser() !== null;
}


export function login(user) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(user)
  );
}


export function logout() {
  localStorage.removeItem(
    AUTH_STORAGE_KEY
  );
}