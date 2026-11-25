import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { WORDMARK_SESSION_KEY } from "@/lib/wordmark";
import "./globals.css";

// Body text. To swap, see "fonts" in the README.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Section headers only. Variable font, OFL licensed (app/fonts/OFL.txt).
const outfit = localFont({
  src: "./fonts/Outfit-Variable.ttf",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  icons: { icon: { url: asset(site.brand.logoStatic), type: "image/svg+xml" } },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [{ url: asset("/og.jpg"), width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: [asset("/og.jpg")] },
};

export const viewport: Viewport = { themeColor: "#ece4f1", colorScheme: "light" };

// Runs before first paint. Marks repeat visits (this session) and reduced
// motion so the hero wordmark renders in its final state with no flash.
const wordmarkScript = `try{var d=document.documentElement;if(sessionStorage.getItem(${JSON.stringify(
  WORDMARK_SESSION_KEY,
)})||matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.wm="static"}catch(e){document.documentElement.dataset.wm="static"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: wordmarkScript }} />
        <noscript>
          <style>{`.wm-line{clip-path:none!important}[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
        >
          {site.ui.skipToContent}
        </a>
        <Header />
        <main id="content" className="flex-1 pt-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
