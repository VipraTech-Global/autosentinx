import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the app pages that show real audit data. "/runs" (the index) and "/runs/..." (a specific run)
// both require a session; "/canned-examples" is the synthetic demo page and stays open. The dot-guard
// excludes any static asset that happens to sit under a gated prefix (run ids are dotless hex), so a
// public file like /runs/x.json is never auth-redirected into login HTML.
const isProtected = (p: string) => p === "/new" || p === "/runs" || (p.startsWith("/runs/") && !p.includes("."));

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
