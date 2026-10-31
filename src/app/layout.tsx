import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/env";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const manrope = localFont({
  src: "../../public/fonts/manrope-latin.woff2",
  // Local files keep the application independent of runtime Google Fonts requests.
  variable: "--font-manrope",
  display: "swap",
  weight: "400 800",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "../../public/fonts/instrument-serif-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/instrument-serif-italic-latin.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon.ico" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#B85C46",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
