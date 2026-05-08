import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fuxion AI | Tu Vendedor Inteligente 24/7",
  description: "Dashboard premium para gestionar tu agente de ventas con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <body className="antialiased selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}

