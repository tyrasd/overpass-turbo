// nominatim module
import configs from "./configs";
import {geocoder, GeocodingResult} from "./geocoding";
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

function normalize(result: NominatimResult): GeocodingResult {
  const [south, north, west, east] = result.boundingbox.map(Number);
  return {
    name: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
    bounds: [south, west, north, east],
    osm_type: result.osm_type,
    osm_id: result.osm_id
  };
}

/** queries nominatim, bypassing the cache */
async function request(search: string): Promise<GeocodingResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("X-Requested-With", configs.appname);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", search);
  try {
    return (await requestJson<NominatimResult[]>(url)).map(normalize);
  } catch (error) {
    console.log("nominatim request failed", error);
    throw new Error(
      "An error occurred while contacting the osm search server nominatim.openstreetmap.org :("
    );
  }
}

/* note: the nominatim usage policy forbids autocomplete style querying,
 * see https://operations.osmfoundation.org/policies/nominatim/
 */
export const {get, getBest} = geocoder(request);
