"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";

/** Logs navigation + uncaught client errors/rejections to the unified stream. */
export function ClientLogger() {
  const pathname = usePathname();

  useEffect(() => {
    logger.info(`route → ${pathname}`);
  }, [pathname]);

  useEffect(() => {
    logger.info("client app mounted");

    const onError = (e: ErrorEvent) =>
      logger.error(`window error: ${e.message}`, {
        source: e.filename,
        line: e.lineno,
        col: e.colno,
      });
    const onRejection = (e: PromiseRejectionEvent) =>
      logger.error(`unhandled promise rejection: ${String(e.reason)}`);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
