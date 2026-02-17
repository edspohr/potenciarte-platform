import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Potenciarte — Plataforma de Eventos',
  description: 'Gestión integral de eventos corporativos, acreditación por QR y diplomas digitales.',
  keywords: ['eventos', 'gestión', 'QR', 'check-in', 'diplomas', 'potenciarte'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            theme="dark"
            toastOptions={{
              style: {
                background: '#0c0c0f',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fafafa',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
