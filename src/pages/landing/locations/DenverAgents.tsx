import LocationTemplate, { LocationData } from "../LocationTemplate";

const denverData: LocationData = {
  city: "Denver",
  state: "Colorado",
  stateAbbr: "CO",
  slug: "denver-real-estate-agents",
  medianPrice: "$615,000",
  marketTrend: "Competitive",
  agentCount: "3,800+",
  marketDescription: "Denver's outdoor lifestyle attracts young professionals and remote workers. Agents who showcase neighborhood amenities and mountain access through Instagram see strong engagement.",
  neighborhoods: [
    "Cherry Creek",
    "Washington Park",
    "Capitol Hill",
    "Highlands",
    "LoDo",
    "RiNo",
    "Congress Park",
    "Park Hill",
    "Stapleton",
    "Uptown",
    "Sloan's Lake",
    "Baker",
  ],
};

export default function DenverAgents() {
  return <LocationTemplate location={denverData} />;
}
