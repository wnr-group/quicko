// Server-side "now" helper. Kept out of React render (a plain function) so it
// doesn't trip the react purity rule; the create/edit pages pass these as props.
export function dateWindow() {
  const iso = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);
  return { today: iso(0), tomorrow: iso(1), weekOut: iso(7) };
}

/** Today's date in India (YYYY-MM-DD). Arrival tiers are counted in IST days, so
 *  a 1 a.m. IST request still sees "today" as today (UTC would say yesterday). */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
