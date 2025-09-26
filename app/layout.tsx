import type { Metadata } from "next";
import "./globals.css";
import { Libre_Barcode_39_Text } from "next/font/google";

const barcode = Libre_Barcode_39_Text({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barcode",
});

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
      <body className={`${barcode.variable} antialiased transition-colors`}>
        {children}
      </body>
    </html>
  );
}
