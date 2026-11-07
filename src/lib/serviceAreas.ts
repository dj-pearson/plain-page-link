/**
 * US-281: an agent's service cities, as shown on their public page and in its
 * structured data.
 *
 * `profiles.service_cities` is jsonb, so a row can hold blanks, stray
 * whitespace or the same city twice (the editor only blocks an exact repeat).
 * The public header used to show the first city and "+2 more", which told a
 * visitor nothing about whether the agent covers their town.
 */

/** Trimmed, non-empty, de-duplicated (case-insensitively) city names, in order. */
export function cleanServiceCities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const cities: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const city = entry.trim().replace(/\s+/g, ' ');
    if (!city) continue;
    const key = city.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cities.push(city);
  }
  return cities;
}

/**
 * "Austin", "Austin and Round Rock", "Austin, Round Rock and Cedar Park".
 * No serial comma, matching the copy on the page.
 */
export function formatServiceCities(value: unknown): string {
  const cities = cleanServiceCities(value);
  if (cities.length <= 1) return cities[0] ?? '';
  return `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`;
}

/** schema.org areaServed: one City per service city, or undefined when there are none. */
export function areaServedSchema(
  value: unknown
): Array<{ '@type': 'City'; name: string }> | undefined {
  const cities = cleanServiceCities(value);
  return cities.length > 0 ? cities.map((name) => ({ '@type': 'City' as const, name })) : undefined;
}
