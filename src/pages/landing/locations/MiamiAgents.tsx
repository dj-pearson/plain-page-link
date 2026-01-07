import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

const miamiData = getLocationBySlug("miami-real-estate-agents");

export default function MiamiAgents() {
  if (!miamiData) {
    throw new Error("Miami location data not found");
  }
  return <LocationTemplate location={miamiData} />;
}
