import LocationTemplate, { LocationData } from "../LocationTemplate";

const phoenixData: LocationData = {
  city: "Phoenix",
  state: "Arizona",
  stateAbbr: "AZ",
  slug: "phoenix-real-estate-agents",
  medianPrice: "$450,000",
  marketTrend: "Growing",
  agentCount: "7,100+",
  marketDescription: "Phoenix attracts retirees and California transplants seeking affordability, creating opportunities for agents with strong online lead generation strategies.",
  neighborhoods: [
    "Scottsdale",
    "Paradise Valley",
    "Arcadia",
    "Biltmore",
    "Downtown Phoenix",
    "Tempe",
    "Chandler",
    "Gilbert",
    "Mesa",
    "Ahwatukee",
    "North Phoenix",
    "Camelback East",
  ],
};

export default function PhoenixAgents() {
  return <LocationTemplate location={phoenixData} />;
}
