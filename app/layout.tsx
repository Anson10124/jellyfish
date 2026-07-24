import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/context/i18n-context";
import { Navbar } from "@/components/common";
import { LOCAL_STORAGE_KEY, DEFAULT_LOCALE, Locale } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jellyfish",
  description: "A web third party client for jellyfin with integration with Seerr",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCAL_STORAGE_KEY)?.value;
  const initialLocale: Locale =
    rawLocale === "zh-TW" || rawLocale === "en" ? rawLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        <I18nProvider initialLocale={initialLocale}>
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
