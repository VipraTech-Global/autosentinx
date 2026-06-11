import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtected = (p: string) => p === "/new" || p.startsWith("/runs/");

// Logs every page request, and gates the app pages behind a login cookie (Next 16 proxy = middleware).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // eslint-disable-next-line no-console
  console.log(`[req]    ${request.method.padEnd(4)} ${pathname}`);
  if (isProtected(pathname) && !request.cookies.get("sx_jwt")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // skip static assets, the favicon, and the log sink itself (avoid noise/loops)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/log).*)"],
};
