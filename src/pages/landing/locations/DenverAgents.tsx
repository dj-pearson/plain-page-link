import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

const denverData = getLocationBySlug("denver-real-estate-agents");

export default function DenverAgents() {
  if (!denverData) {
    throw new Error("Denver location data not found");
  }
  return <LocationTemplate location={denverData} />;
}
