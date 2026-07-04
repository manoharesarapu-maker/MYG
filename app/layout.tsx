import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guide — City of Bayside Harbour",
  description: "Civic intake assistant for City of Bayside Harbour parking permits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
