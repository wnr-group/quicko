import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Quiko — Just Quick As That",
  description:
    "Peer-to-peer package delivery. Send packages with travelers already going your route — faster, cheaper, greener.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Quiko", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffd93d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
