import type { Metadata } from "next";
import { getAllBikes } from "@/lib/queries";
import { ComparePicker, type PickerBike } from "@/components/ComparePicker";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Compare Motorcycles",
  description: "Build a side-by-side specification comparison of up to four motorcycles available in Bangladesh.",
  alternates: { canonical: "/compare" },
};

export default async function CompareIndex() {
  const bikes = await getAllBikes();
  const data: PickerBike[] = bikes.map((b) => ({
    token: `${b.manufacturer.slug}-${b.slug}`,
    name: b.name,
    manufacturerName: b.manufacturer.name,
    category: b.category,
    engineCc: b.engineCc,
    powerHp: b.powerHp,
  }));

  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          webPageSchema("Compare Motorcycles", "Build a side-by-side specification comparison of up to four motorcycles available in Bangladesh.", "/compare"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ]}
      />
      <Reveal>
        <h1 className="text-4xl font-black text-graphite-900">Compare bikes</h1>
        <p className="mt-2 max-w-xl text-graphite-600">
          Select two to four motorcycles and we’ll build a side-by-side spec table, highlighting the
          best value in every category.
        </p>
      </Reveal>
      <div className="mt-8">
        <ComparePicker bikes={data} />
      </div>
    </div>
  );
}
