// Brand tokens mirrored from the web app's globals.css so the two apps look identical.
export const colors = {
  brand: "#fddc2b",
  brandSoft: "#fff7cf",
  ink: "#000000",
  inkSoft: "#3f3f46",
  canvas: "#f6f6f3",
  white: "#ffffff",
  muted: "#8a8a94",
  line: "#e6e6e2",
  success: "#16a34a",
  successSoft: "#dcfce7",
  error: "#dc2626",
  errorSoft: "#fee2e2",
  info: "#2563eb",
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const space = (n: number) => n * 4;

export const shadowCard = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
