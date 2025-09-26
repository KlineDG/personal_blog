import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Blog",
  description: "Notes on craft, curiosity, and building a slower web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased transition-colors">
        {children}
      </body>
    </html>
  );
}
