import LocationTemplate, { LocationData } from "../LocationTemplate";

const miamiData: LocationData = {
  city: "Miami",
  state: "Florida",
  stateAbbr: "FL",
  slug: "miami-real-estate-agents",
  medianPrice: "$565,000",
  marketTrend: "Rising",
  agentCount: "8,500+",
  marketDescription: "Miami's luxury condo market and international buyer demand create unique opportunities for agents with strong Instagram presence and bilingual capabilities.",
  neighborhoods: [
    "Brickell",
    "Coconut Grove",
    "Coral Gables",
    "Miami Beach",
    "Wynwood",
    "Design District",
    "Key Biscayne",
    "Aventura",
    "Bal Harbour",
    "Sunny Isles Beach",
    "Pinecrest",
    "South Beach",
  ],
};

export default function MiamiAgents() {
  return <LocationTemplate location={miamiData} />;
}
