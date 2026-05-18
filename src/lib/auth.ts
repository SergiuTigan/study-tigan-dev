import { cookies } from "next/headers";

const SESSION_COOKIE = "study_session";
const SESSION_VALUE = "authenticated";

const VALID_EMAIL = "sergiu@tigan.dev";
const VALID_PASSWORD = "dobbyEoZdreanta2026";

export function validateCredentials(email: string, password: string): boolean {
  return email === VALID_EMAIL && password === VALID_PASSWORD;
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}
