// osmnames module
import configs from "./configs";
import {geocoder, GeocodingResult} from "./geocoding";
import {requestJson} from "./httpRequest";

/** a single search result of the osmnames API */
export interface OsmNamesResult {
  display_name: string;
  lat: number;
  lon: number;
  /** west, south, east and north boundary, in decimal degrees */
  boundingbox?: [number, number, number, number];
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
}

function normalize(result: OsmNamesResult): GeocodingResult {
  const [west, south, east, north] = result.boundingbox ?? [];
  return {
    name: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
    bounds: result.boundingbox && [south, west, north, east],
    osm_type: result.osm_type,
    osm_id: result.osm_id
  };
}

/** queries osmnames, bypassing the cache */
async function request(search: string): Promise<GeocodingResult[]> {
  const url = new URL(
    `https://search.osmnames.org/q/${encodeURIComponent(search)}.js`
  );
  url.searchParams.set("key", configs.osmnamesApiKey);
  try {
    const data = await requestJson<{results: OsmNamesResult[]}>(url);
    return data.results.map(normalize);
  } catch (error) {
    console.log("osmnames request failed", error);
    throw new Error(
      "An error occurred while contacting the search server osmnames.org :("
    );
  }
}

/* note: in contrast to ./nominatim, osmnames may be queried for autocompletion */
export const {get, getBest} = geocoder(request);
