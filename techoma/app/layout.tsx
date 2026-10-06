import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GrainOverlay } from "@/components/motion/GrainOverlay";
import { LoadingScreen } from "@/components/motion/LoadingScreen";
import { MapBackground } from "@/components/motion/MapBackground";
import { site } from "@/content/site";
import { paladins, paladinsLaser, paladinsGrad, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: site.seo.siteUrl.startsWith("http") ? new URL(site.seo.siteUrl) : undefined,
  title: {
    default: site.seo.titleDefault,
    template: site.seo.titleTemplate,
  },
  description: site.seo.descriptionDefault,
  openGraph: {
    title: site.seo.titleDefault,
    description: site.seo.descriptionDefault,
    images: [{ url: site.seo.ogImage, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.titleDefault,
    description: site.seo.descriptionDefault,
    images: [site.seo.ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${paladins.variable} ${paladinsLaser.variable} ${paladinsGrad.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <LoadingScreen />
        <MapBackground />
        {/* Explicit positive stacking context: any `position: relative` section
            inside page content (e.g. the hero) would otherwise paint in the same
            step as positioned z-index:auto elements, which can land above a
            negative-z-index background in some engines. Wrapping content at z-10
            keeps the relationship unambiguous. */}
        <div className="relative z-10">
          <GrainOverlay />
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
