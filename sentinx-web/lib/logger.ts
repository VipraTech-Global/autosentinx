// Isomorphic logger. In the browser it logs to the console AND mirrors to the
// server (/api/log) so everything appears in one place (the dev terminal / dev.log).

type Level = "debug" | "info" | "warn" | "error";

function safe(v: unknown): unknown {
  if (v === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

function emit(level: Level, msg: string, meta?: unknown) {
  const line = `[Sentinx] ${msg}`;
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.info;
  fn(line, meta ?? "");

  if (typeof window !== "undefined") {
    try {
      const body = JSON.stringify({
        level,
        msg,
        meta: safe(meta),
        path: window.location.pathname,
        t: new Date().toISOString(),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/log", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/log", {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* never let logging break the app */
    }
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit("debug", msg, meta),
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
};
