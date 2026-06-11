import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Logs every page request to the server stdout (dev terminal / dev.log).
export function proxy(request: NextRequest) {
  // eslint-disable-next-line no-console
  console.log(`[req]    ${request.method.padEnd(4)} ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // skip static assets, the favicon, and the log sink itself (avoid noise/loops)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/log).*)"],
};
