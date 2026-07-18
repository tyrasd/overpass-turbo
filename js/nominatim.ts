// nominatim module
import configs from "./configs";
import {requestJson} from "./httpRequest";

/** a single search result of the nominatim API */
export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  /** south, north, west and east boundary, as decimal degree strings */
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

/** narrows down the results to those usable in the current context */
type Filter = (result: NominatimResult) => unknown;

const cache: Record<string, Promise<NominatimResult[]>> = {};

/** queries nominatim, bypassing the cache */
export async function request(search: string): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("X-Requested-With", configs.appname);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", search);
  try {
    return await requestJson<NominatimResult[]>(url);
  } catch (error) {
    console.log("nominatim request failed", error);
    throw new Error(
      "An error occurred while contacting the osm search server nominatim.openstreetmap.org :("
    );
  }
}

/** returns all results for `search`, from the cache if it was queried before */
export function get(search: string): Promise<NominatimResult[]> {
  // caching the promise also keeps concurrent searches down to one request
  cache[search] ??= request(search).catch((error) => {
    delete cache[search]; // a failed search should be retried, not remembered
    throw error;
  });
  return cache[search];
}

/** returns the first result for `search` that passes the optional `filter` */
export async function getBest(
  search: string,
  filter?: Filter
): Promise<NominatimResult> {
  const data = await get(search);
  const results = filter ? data.filter(filter) : data;
  if (results.length === 0) throw new Error("No result found");
  return results[0];
}
