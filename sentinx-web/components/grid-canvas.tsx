"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Cursor-reactive ambient background — a faithful React port of the Latticly
 * landing animation. A static CSS dot-grid (`.dot-grid`) is always visible; this
 * canvas overlays lit dots + settling connector lines near the pointer.
 *
 * Theme-aware: dot/line colours are read from the `--grid-dot-rgb` / `--grid-line-rgb`
 * tokens and re-read whenever the next-themes theme flips, so it recolours live
 * (dark ink dots on the light canvas, light dots on the dark canvas).
 * Respects prefers-reduced-motion (static grid only, no RAF).
 */
export function GridCanvas() {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = useRef({ dot: "15, 23, 34", line: "29, 91, 214" });

  // Re-read the theme's grid colours on mount and whenever the theme flips.
  // (getComputedStyle reflects the class next-themes applies, so this is correct
  // even before resolvedTheme hydrates.)
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const dot = root.getPropertyValue("--grid-dot-rgb").trim();
    const line = root.getPropertyValue("--grid-line-rgb").trim();
    if (dot) colors.current.dot = dot;
    if (line) colors.current.line = line;
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const GRID = 44;
    const HALF = GRID / 2;
    const LINE_LEN = GRID - 20;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    const mouse = { x: -1, y: -1, active: false };
    const smooth = { x: -1, y: -1 };
    let master = 0;
    const cells = new Map<string, number>();
    const settles = new Map<string, { settle: number; lastOpacity: number }>();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // deterministic per-line hash (FNV-1a) -> [0,1), picks wobble direction
    function hash(str: string) {
      let t = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        t ^= str.charCodeAt(i);
        t = Math.imul(t, 0x01000193);
      }
      return (t >>> 0) / 0xffffffff;
    }

    const snap = (v: number) => Math.round((v - HALF) / GRID) * GRID + HALF;

    function drawLine(midX: number, midY: number, baseAngle: number, opacity: number, id: string) {
      const dir = hash(id) < 0.5 ? -1 : 1;
      const prev = settles.get(id);
      const last = prev ? prev.lastOpacity : 0;
      let settle = prev ? prev.settle : 0;
      const delta = opacity - last;
      if (delta > 0.02 && opacity < 0.98) settle = Math.max(0, settle - 2.2 * delta);
      else settle = Math.min(1, settle + 0.02);
      settles.set(id, { settle, lastOpacity: opacity });
      if (opacity < 0.02 && settle > 0.98) settles.delete(id);

      const rot = (1 - settle) * 1.2 * dir;
      ctx!.strokeStyle = "rgba(" + colors.current.line + ", " + opacity + ")";
      ctx!.save();
      ctx!.translate(midX, midY);
      ctx!.rotate(baseAngle + rot);
      ctx!.beginPath();
      ctx!.moveTo(-LINE_LEN / 2, 0);
      ctx!.lineTo(LINE_LEN / 2, 0);
      ctx!.stroke();
      ctx!.restore();
    }

    function paintNeighborhood(cx: number, cy: number, ease: boolean) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const r = Math.sqrt(i * i + j * j);
          if (r > 2) continue;
          const x = cx + i * GRID;
          const y = cy + j * GRID;
          const key = x + "," + y;
          const target = Math.min(1, (1 - r / 2) * 2);
          const cur = cells.get(key) || 0;
          if (target > cur) {
            cells.set(key, ease ? cur + (target - cur) * 0.5 : Math.max(cur, target));
          }
        }
      }
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);

      master = mouse.active ? Math.min(1, master + 0.024) : Math.max(0, master - 0.008);

      if (mouse.active && mouse.x >= 0 && mouse.y >= 0) {
        if (smooth.x < 0) {
          smooth.x = mouse.x;
          smooth.y = mouse.y;
        } else {
          smooth.x += (mouse.x - smooth.x) * 0.06;
          smooth.y += (mouse.y - smooth.y) * 0.06;
        }
      }

      if (mouse.active && mouse.x >= 0 && mouse.y >= 0) {
        paintNeighborhood(snap(smooth.x), snap(smooth.y), true);
        paintNeighborhood(snap(mouse.x), snap(mouse.y), false);
      }

      cells.forEach((v, k) => {
        const nv = v - 0.008;
        if (nv <= 0.01) cells.delete(k);
        else cells.set(k, nv);
      });

      if (cells.size === 0 && master <= 0.001) {
        raf = requestAnimationFrame(frame);
        return;
      }

      ctx!.lineWidth = 1;
      cells.forEach((v, key) => {
        const parts = key.split(",");
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const op = v * master;

        ctx!.fillStyle = "rgba(" + colors.current.dot + ", " + op + ")";
        ctx!.beginPath();
        ctx!.arc(x, y, 1, 0, Math.PI * 2);
        ctx!.fill();

        const right = cells.get(x + GRID + "," + y) || 0;
        if (right > 0.01) {
          const o = Math.min(op, right * master);
          drawLine(x + GRID / 2, y, 0, o, x + "," + y + "->r");
        }
        const down = cells.get(x + "," + (y + GRID)) || 0;
        if (down > 0.01) {
          const o = Math.min(op, down * master);
          drawLine(x, y + GRID / 2, Math.PI / 2, o, x + "," + y + "->d");
        }
      });

      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    resize();
    if (!reduceMotion) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div className="dot-grid" aria-hidden />
      <canvas ref={canvasRef} className="dot-grid-canvas" aria-hidden />
    </>
  );
}
