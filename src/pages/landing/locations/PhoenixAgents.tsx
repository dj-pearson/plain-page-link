import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

const phoenixData = getLocationBySlug("phoenix-real-estate-agents");

export default function PhoenixAgents() {
  if (!phoenixData) {
    throw new Error("Phoenix location data not found");
  }
  return <LocationTemplate location={phoenixData} />;
}
