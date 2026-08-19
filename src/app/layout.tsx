import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { organizationSchema, websiteSchema, SITE_URL } from "@/lib/seo";
import { asset } from "@/lib/basePath";

// Mona Sans (GitHub's variable typeface, MIT) — self-hosted from
// @fontsource-variable/mona-sans so there's no external font request and no
// layout shift. The weight axis covers 200–900.
const monaSans = localFont({
  src: "../../node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 900",
  style: "normal",
});

export const metadata: Metadata = {
  // Single source of truth: hardcoding this made every canonical URL disagree
  // with the sitemap and JSON-LD whenever SITE_URL pointed somewhere else.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Motocodex — Motorcycle Price in Bangladesh, Specs & Comparison",
    template: "%s · Motocodex",
  },
  description:
    "Motocodex is a modern motorcycle specifications and comparison directory for Bangladesh. Browse engine, power, torque, mileage, weight and price (BDT) across every major brand available in BD.",
  keywords: [
    "motorcycle price in bangladesh",
    "bike price bd",
    "motorcycle specifications",
    "bike comparison bangladesh",
    "mileage",
    "engine cc",
  ],
  openGraph: {
    title: "Motocodex — Motorcycle Price in Bangladesh, Specs & Comparison",
    description: "Compare motorcycles available in Bangladesh by engine, power, torque, mileage, weight and price (৳).",
    type: "website",
    siteName: "Motocodex",
    // Next already applies basePath to openGraph.images — wrapping it in asset()
    // double-prefixed every social image. Icons below are NOT prefixed by Next,
    // so those do still need it.
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: asset("/favicon.png"),
    shortcut: asset("/favicon.png"),
    apple: asset("/favicon.png"),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={monaSans.variable}>
      <body className="min-h-screen bg-ink-100 font-sans">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
