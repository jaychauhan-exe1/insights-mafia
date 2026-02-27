import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

const ONE_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * ONE_DAY;

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Allow JWT to be valid for up to 30 days
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(
  user: { id: string; email: string; role: string },
  rememberMe?: boolean,
) {
  // Create the session
  const duration = rememberMe ? THIRTY_DAYS : ONE_DAY;
  const expires = new Date(Date.now() + duration);
  const session = await encrypt({ user, expires, rememberMe });

  // Save the session in a cookie
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function logout() {
  // Destroy the session
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  const duration = parsed.rememberMe ? THIRTY_DAYS : ONE_DAY;
  parsed.expires = new Date(Date.now() + duration);

  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: parsed.expires,
    path: "/",
  });
  return res;
}
