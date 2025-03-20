import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

const APP_NAME = "TRANSIX";
const APP_DESCRIPTION = "Sistema de Gestión de Transporte";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "es_ES",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
    other: {
      rel: "apple-touch-icon",
      url: "/apple-icon.png",
    },
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const neutro = localFont({
  src: "../../public/fonts/Neutro-ExtraBold.otf",
  variable: "--font-neutro",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${neutro.variable}`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
