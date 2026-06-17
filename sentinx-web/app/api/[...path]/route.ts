// BFF proxy — forwards /api/<path> to the FastAPI backend, attaching the JWT from the httpOnly cookie.
// The browser only ever talks to this origin → no CORS, and the token never reaches client JS.
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_BASE || "http://127.0.0.1:8080";

// Paths reachable without a session (health/liveness probes).
const PUBLIC_PATHS = new Set(["health"]);

async function forward(req: NextRequest, path: string[]) {
  const token = (await cookies()).get("sx_jwt")?.value;
  if (!token && !PUBLIC_PATHS.has(path[0])) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const url = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;
  const headers: Record<string, string> = {};
  if (token) headers["authorization"] = `Bearer ${token}`;
  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) {
      init.body = body;
      headers["content-type"] = req.headers.get("content-type") ?? "application/json";
    }
  }
  const upstream = await fetch(url, init);
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };
export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
