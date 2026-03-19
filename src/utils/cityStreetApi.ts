// Shared Israeli city/street API utility
// Source: data.gov.il streets dataset

const GOV_IL_API_URL = "https://data.gov.il/api/3/action/datastore_search";
const GOV_IL_STREETS_RESOURCE_ID = "bf185c7f-1a4e-4662-88c5-fa118a244bda";

interface CityStreetRecord {
  city: string;
  street: string;
}

let allRecordsCache: CityStreetRecord[] | null = null;
let fetchPromise: Promise<CityStreetRecord[]> | null = null;

export const loadAllRecords = (): Promise<CityStreetRecord[]> => {
  if (allRecordsCache) return Promise.resolve(allRecordsCache);
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const url = `${GOV_IL_API_URL}?resource_id=${GOV_IL_STREETS_RESOURCE_ID}&limit=32000&fields=city_name,street_name`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const records: CityStreetRecord[] = [];
      for (const r of (data?.result?.records ?? [])) {
        const city = ((r["city_name"] as string) || "").trim();
        const street = ((r["street_name"] as string) || "").trim();
        if (!city) continue;
        records.push({ city, street });
      }
      allRecordsCache = records;
      return records;
    } catch {
      return [];
    }
  })();
  return fetchPromise;
};

const normalize = (s: string) => s.trim().toLowerCase();

/** Returns unique matching city names */
export const searchCities = async (query: string): Promise<string[]> => {
  const records = await loadAllRecords();
  const q = normalize(query);
  const seen = new Set<string>();
  const starts: string[] = [];
  const contains: string[] = [];
  for (const r of records) {
    if (seen.has(r.city)) continue;
    const cl = normalize(r.city);
    if (cl.startsWith(q)) { seen.add(r.city); starts.push(r.city); }
    else if (cl.includes(q)) { seen.add(r.city); contains.push(r.city); }
  }
  return [...starts, ...contains].slice(0, 20);
};

/** Returns street names for a given city, filtered by query */
export const searchStreets = async (city: string, query: string): Promise<string[]> => {
  const records = await loadAllRecords();
  const cityL = normalize(city);
  const q = normalize(query);
  const seen = new Set<string>();
  const starts: string[] = [];
  const contains: string[] = [];
  for (const r of records) {
    if (normalize(r.city) !== cityL) continue;
    if (!r.street || seen.has(r.street)) continue;
    const sl = normalize(r.street);
    if (!q || sl.startsWith(q)) { seen.add(r.street); starts.push(r.street); }
    else if (sl.includes(q)) { seen.add(r.street); contains.push(r.street); }
  }
  return [...starts, ...contains].slice(0, 20);
};
