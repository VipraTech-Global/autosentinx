// Login (or sign up a new operator) against the backend, then store the JWT as an httpOnly cookie.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_BASE || "http://127.0.0.1:8080";

function call(path: string, body: unknown) {
  return fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  let r = await call("/auth/login", { email, password });
  if (r.status === 401) {
    // A 401 from /auth/login is intentionally ambiguous (no such account OR wrong
    // password). Try to create the account: if signup says 409 "already registered",
    // the account DOES exist — so the 401 was a wrong password, not a new operator.
    // Report that honestly instead of leaking the misleading "email already registered".
    const s = await call("/auth/signup", { email, password });
    if (s.status === 409) {
      return NextResponse.json(
        { detail: "Incorrect password for this account." },
        { status: 401 },
      );
    }
    r = s; // genuinely new operator (signup succeeded) or a real signup error (e.g. weak password)
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ detail: data.detail ?? "login failed" }, { status: r.status });
  (await cookies()).set("sx_jwt", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return NextResponse.json({ email: data.email });
}
