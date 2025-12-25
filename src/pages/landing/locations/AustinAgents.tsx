import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

const austinData = getLocationBySlug("austin-real-estate-agents");

export default function AustinAgents() {
  if (!austinData) {
    throw new Error("Austin location data not found");
  }
  return <LocationTemplate location={austinData} />;
}
