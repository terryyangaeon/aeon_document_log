import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isDev = process.env.NEXT_PUBLIC_APP_ENV === "dev";

export const metadata: Metadata = {
  title: isDev ? "[DEV] AEON Document Log" : "AEON Document Log",
  description: "Document reference number management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-env={isDev ? "dev" : undefined}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="env-detect"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `if(window.self!==window.top)document.documentElement.classList.add("in-iframe");if(/^dev\\./.test(location.hostname))document.documentElement.dataset.env="dev";`,
          }}
        />
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
