import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Poppins — the brand's rounded geometric sans (brand guidelines §4). Weights
// cover body (400/500), semibold UI (600), and the bold/black wordmark & heads.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Quiko — Just Quick As That",
  description:
    "Peer-to-peer package delivery. Send packages with travelers already going your route — faster, cheaper, greener.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Quiko", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fddc2b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
