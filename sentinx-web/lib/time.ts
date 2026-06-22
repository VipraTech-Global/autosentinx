// Time formatting. Backend timestamps are NAIVE UTC (models.py _now() strips tzinfo → no offset),
// so a bare "2026-06-21T11:06:30" must be read as UTC, then displayed in IST (Asia/Kolkata, +5:30)
// — the operating timezone for this NBFC tool. One helper so every screen renders times identically.

/** Format a naive-UTC (or zoned) ISO string as "21 Jun 2026, 16:36 IST". Returns "—" when absent. */
export function fmtIST(iso?: string | null): string {
  if (!iso) return "—";
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(iso);
  const d = new Date(hasZone ? iso : `${iso}Z`); // force UTC interpretation for naive strings
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d).replace(",", "") + " IST";
}
