// Server Component: fetches manufacturer + model data on the server and hands
// a plain serialisable payload to the client-side MegaMenu. The DB query never
// reaches the browser.
import { getManufacturersWithBikes } from "@/lib/queries";
import { type MegaMenuData } from "./MegaMenu";
import { NavbarChrome } from "./NavbarChrome";

// Server Component: fetches manufacturer + model data on the server and hands a
// plain serialisable payload to the client-side morphing header. The DB query
// never reaches the browser.
export async function Navbar() {
  const manufacturers = await getManufacturersWithBikes();

  const data: MegaMenuData = manufacturers.map((m) => ({
    slug: m.slug,
    name: m.name,
    country: m.country,
    accentColor: m.accentColor,
    logoText: m.logoText ?? m.name.slice(0, 2).toUpperCase(),
    bikeCount: m.bikes.length,
    bikes: m.bikes.map((b) => ({
      name: b.name,
      slug: b.slug,
      series: b.series,
      category: b.category,
      engineCc: b.engineCc,
    })),
  }));

  return <NavbarChrome data={data} />;
}
