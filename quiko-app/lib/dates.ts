// Server-side "now" helper. Kept out of React render (a plain function) so it
// doesn't trip the react purity rule; the create/edit pages pass these as props.
export function dateWindow() {
  const iso = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);
  return { today: iso(0), tomorrow: iso(1), weekOut: iso(7) };
}
