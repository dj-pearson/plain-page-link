import { useParams, Navigate } from "react-router-dom";
import LocationTemplate from "../LocationTemplate";
import { getLocationBySlug } from "@/data/locations";

/**
 * Dynamic location page component
 * Renders location pages based on URL slug
 * Used for programmatic SEO with 20+ city pages
 */
export default function DynamicLocationPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/for-real-estate-agents" replace />;
  }

  const locationData = getLocationBySlug(slug);

  if (!locationData) {
    // If location not found, redirect to main landing page
    return <Navigate to="/for-real-estate-agents" replace />;
  }

  return <LocationTemplate location={locationData} />;
}
