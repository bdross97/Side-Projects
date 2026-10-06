import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

// Regular cut — page titles, section headers, everywhere font-display is used
// except the wordmark itself.
export const paladins = localFont({
  src: "../public/fonts/Paladins.woff2",
  variable: "--font-paladins",
  display: "swap",
});

// Laser cut — the main TECHOMA wordmark only.
export const paladinsLaser = localFont({
  src: "../public/fonts/PaladinsLaser.woff2",
  variable: "--font-paladins-laser",
  display: "swap",
});

// Gradient cut — the small "THE" label in the wordmark only.
export const paladinsGrad = localFont({
  src: "../public/fonts/PaladinsGrad.woff2",
  variable: "--font-paladins-grad",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
