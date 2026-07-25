import type { Metadata } from "next";
import { RoutePlanner } from "@/components/RoutePlanner";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Route Plan — Randomize Your Ride",
  description:
    "Plan a spontaneous motorcycle ride: pick a destination or hit Surprise Me for a random route within your chosen distance, choose highway or back-roads, then open turn-by-turn navigation in Google Maps. No app, no sign-up.",
  alternates: { canonical: "/route-plan" },
};

export default function RoutePlanPage() {
  return (
    <div className="container-page py-10">
      <JsonLd
        data={[
          webPageSchema(
            "Route Plan — Randomize Your Ride",
            "Plan or randomize a motorcycle route and open it in Google Maps.",
            "/route-plan"
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Route Plan", path: "/route-plan" },
          ]),
        ]}
      />

      <Reveal>
        <div className="mb-7 max-w-2xl">
          <span className="eyebrow">New · beta</span>
          <h1 className="section-title mt-3">Route Plan — randomize your ride</h1>
          <p className="mt-2 text-graphite-600">
            Not sure where to ride today? Set your start, then either pick a destination or hit{" "}
            <span className="font-semibold text-graphite-800">Surprise me</span> for a random spot within
            your chosen distance. Choose a round trip and whether to avoid highways, then launch
            turn-by-turn navigation — with live traffic — straight in Google Maps.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <RoutePlanner />
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-6 max-w-2xl text-xs text-graphite-400">
          Ride safe: gear up (ATGATT), check the weather, and obey local traffic laws. Distances and
          times shown here are estimates without live traffic — Google Maps provides real-time routing
          when you open directions.
        </p>
      </Reveal>
    </div>
  );
}
