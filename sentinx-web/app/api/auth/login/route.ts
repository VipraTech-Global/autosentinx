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
  if (r.status === 401) r = await call("/auth/signup", { email, password }); // new operator → create account
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
