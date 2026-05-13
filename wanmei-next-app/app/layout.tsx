import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wanmei Vietnam",
  description: "Wanmei Vietnam — game portal",
  keywords: ["Wanmei", "Vietnam", "games"],
  alternates: { canonical: "https://wanmeivn.com/" },
  openGraph: {
    title: "Wanmei Vietnam",
    description: "Wanmei Vietnam — game portal",
    type: "website",
    url: "https://wanmeivn.com/",
    locale: "vi_VN",
  },
  twitter: { card: "summary", title: "Wanmei Vietnam" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
