import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

const laData = getLocationBySlug("los-angeles-real-estate-agents");

export default function LosAngelesAgents() {
  if (!laData) {
    throw new Error("Los Angeles location data not found");
  }
  return <LocationTemplate location={laData} />;
}
