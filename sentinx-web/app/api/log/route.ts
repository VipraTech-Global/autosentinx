// Receives client-side log events and prints them to the server stdout
// (the dev terminal / dev.log), giving one unified log stream.

export async function POST(request: Request) {
  try {
    const e = await request.json();
    const lvl = String(e.level ?? "info").toUpperCase().padEnd(5);
    const meta = e.meta !== undefined ? "  " + JSON.stringify(e.meta) : "";
    // eslint-disable-next-line no-console
    console.log(`[client] ${lvl} ${e.path ?? ""} — ${e.msg}${meta}`);
  } catch {
    // eslint-disable-next-line no-console
    console.log("[client] (unparseable log payload)");
  }
  return new Response(null, { status: 204 });
}
