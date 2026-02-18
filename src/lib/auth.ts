import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);
const COOKIE_NAME = "vt-eating-session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function createSession(userId: string, email: string) {
  const token = await createSessionToken(userId, email);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function validateVtEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return normalized.endsWith("@vt.edu");
}

/** Admin emails from env (comma-separated). Must be lowercase @vt.edu. */
export function isAdmin(email: string): boolean {
  const list = process.env.ADMIN_EMAILS ?? "";
  if (!list.trim()) return false;
  const emails = list.split(",").map((e) => e.toLowerCase().trim());
  return emails.includes(email.toLowerCase().trim());
}

export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!isAdmin(session.email)) throw new Error("Admin access required");
  return session;
}
