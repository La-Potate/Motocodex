// Structured-data (schema.org JSON-LD) builders. Server-only usage.
import { bdt } from "./format";
import type { BikeWithManufacturer } from "./queries";

export const SITE_URL = process.env.SITE_URL ?? "https://motocodex.net";

export type Faq = { q: string; a: string };

/** Sitewide Organisation node. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Motocodex",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Motorcycle price, specifications and comparison directory for Bangladesh.",
  };
}

/** Sitewide WebSite node with a sitelinks search box action. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Motocodex",
    url: SITE_URL,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/find-your-bike?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Generic page node (CollectionPage / WebPage / SearchResultsPage). */
export function webPageSchema(
  name: string,
  description: string,
  path: string,
  type: "WebPage" | "CollectionPage" | "SearchResultsPage" = "WebPage"
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: { "@type": "WebSite", name: "Motocodex", url: SITE_URL },
  };
}

/** BreadcrumbList from an ordered list of { name, path }. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

/** FAQPage from a list of Q/A pairs. */
export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Product node for a single bike (price in BDT when available). */
export function bikeProductSchema(bike: BikeWithManufacturer) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${bike.manufacturer.name} ${bike.name}`,
    brand: { "@type": "Brand", name: bike.manufacturer.name },
    category: bike.category,
    ...(bike.imageUrl ? { image: `${SITE_URL}${bike.imageUrl}` } : {}),
    ...(bike.priceBdt != null
      ? {
          offers: {
            "@type": "Offer",
            price: bike.priceBdt,
            priceCurrency: "BDT",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/manufacturers/${bike.manufacturer.slug}/${bike.slug}`,
          },
        }
      : {}),
  };
}

/** Generate model-specific FAQs from a bike's real spec data. */
export function bikeFaqs(bike: BikeWithManufacturer): Faq[] {
  const bm = `${bike.manufacturer.name} ${bike.name}`;
  const faqs: Faq[] = [];

  if (bike.priceBdt != null) {
    faqs.push({
      q: `What is the price of the ${bm} in Bangladesh?`,
      a: `The ${bm} is priced at approximately ${bdt(bike.priceBdt)} in Bangladesh. The final on-road price varies by dealer, district and any ongoing offers, so confirm with an authorised showroom.`,
    });
  }

  const engineBits = [bike.engineCc != null ? `${bike.engineCc}cc` : null, bike.engineType]
    .filter(Boolean)
    .join(" ");
  const powerText = bike.powerRaw ?? (bike.powerHp != null ? `${bike.powerHp} hp` : null);
  if (engineBits || powerText) {
    faqs.push({
      q: `What engine does the ${bm} have?`,
      a: `The ${bm} runs ${engineBits || "its"} engine${
        powerText
          ? `, producing ${powerText}${bike.torqueNm != null ? ` and ${bike.torqueNm} Nm of torque` : ""}`
          : ""
      }.`,
    });
  }

  if (bike.mileageKmpl != null) {
    faqs.push({
      q: `What is the mileage of the ${bm}?`,
      a: `The ${bm} returns a company-claimed mileage of about ${bike.mileageKmpl} km/l. Real-world mileage depends on riding style, traffic and maintenance.`,
    });
  }

  faqs.push({
    q: `Does the ${bm} have ABS?`,
    a: bike.abs
      ? `Yes — the ${bm} is equipped with ABS (anti-lock braking), which helps prevent wheel lock-up and improves braking stability on wet or loose surfaces.`
      : `This ${bm} listing is not recorded with ABS. Variants and model years can differ, so confirm the exact braking setup with the dealer.`,
  });

  if (bike.topSpeedKph != null) {
    faqs.push({
      q: `What is the top speed of the ${bm}?`,
      a: `The ${bm} has an approximate top speed of ${bike.topSpeedKph} km/h, which varies with rider weight, road and conditions.`,
    });
  }

  if (bike.engineCc != null) {
    const beginner = bike.engineCc <= 165;
    faqs.push({
      q: `Is the ${bm} good for beginners?`,
      a: beginner
        ? `With its ${bike.engineCc}cc engine${
            bike.weightKg != null ? ` and ${bike.weightKg} kg kerb weight` : ""
          }, the ${bm} is manageable for newer riders — enough performance for city and highway use without being overwhelming.`
        : `The ${bm}'s ${bike.engineCc}cc engine makes strong power, so it suits riders with some experience. Newer riders should build skills first and always ride with full gear.`,
    });
  }

  return faqs;
}
