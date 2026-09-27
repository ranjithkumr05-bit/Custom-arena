import type { Metadata } from "next";
import "./globals.css";
import Chrome from "@/components/Chrome";
import { Jsonld } from "@/components/ui";
import { SITE } from "@/lib/content";
import { publicCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default:
      "CustomWear — Knitwear Manufacturing in Tiruppur | Orders From 10 Pieces",
    template: "%s | CustomWear, Tiruppur",
  },
  description: SITE.shortDescription,
  keywords: [
    "t-shirt manufacturer Tiruppur",
    "knitwear manufacturer Tamil Nadu",
    "sports jersey manufacturer India",
    "corporate t-shirt manufacturer",
    "low MOQ clothing manufacturer India",
    "private label knitwear Tiruppur",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "CustomWear",
    title: "CustomWear — Knitwear Manufacturing in Tiruppur",
    description: SITE.shortDescription,
    images: [{ url: "/banners/og-card.jpg", width: 1200, height: 630, alt: "CustomWear — knitwear manufacturing, Tiruppur" }],
  },
  twitter: { card: "summary_large_image", images: ["/banners/og-card.jpg"] },
  icons: {
    icon: [
      { url: "/brand/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/brand/customwear-badge-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};

/** Organization + LocalBusiness. Unconfirmed fields are deliberately omitted. */
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  description: SITE.shortDescription,
  url: SITE.url,
  address: {
    "@type": "PostalAddress",
    addressLocality: SITE.location.city,
    addressRegion: SITE.location.state,
    addressCountry: "IN",
  },
  knowsAbout: [
    "Knitwear manufacturing",
    "Sublimation printing",
    "Screen printing",
    "Embroidery",
    "Private label apparel",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Nav labels come from the live catalog so renaming a category in the admin
  // updates the menu too, rather than going stale against the bundled seed.
  const nav = publicCatalog().map((c) => ({
    slug: c.slug,
    title: c.title,
    hero: c.hero,
    count: c.subcategories.length,
  }));

  return (
    <html lang="en-IN">
      <body className="antialiased">
        <Jsonld data={orgLd} />
        <Chrome nav={nav}>{children}</Chrome>
      </body>
    </html>
  );
}
