// geocoding module: a common interface for the geocoders in ./nominatim and ./osmnames

/** a single place found by a geocoder, normalized across the different backends */
export interface GeocodingResult {
  /** human readable name of the place */
  name: string;
  lat: number;
  lon: number;
  /** south, west, north and east boundary, in decimal degrees, if known */
  bounds?: [number, number, number, number];
  /** the OSM object the place was derived from, if the geocoder reports one */
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
}

/** narrows down the results to those usable in the current context */
export type Filter = (result: GeocodingResult) => unknown;

/** a geocoder backend, as exposed by ./nominatim and ./osmnames */
export interface Geocoder {
  /** queries the geocoder, bypassing the cache */
  request(search: string): Promise<GeocodingResult[]>;
  /** returns all results for `search`, from the cache if it was queried before */
  get(search: string): Promise<GeocodingResult[]>;
  /** returns the first result for `search` that passes the optional `filter` */
  getBest(search: string, filter?: Filter): Promise<GeocodingResult>;
}

/** builds a geocoder from a function performing the actual request */
export function geocoder(
  request: (search: string) => Promise<GeocodingResult[]>
): Geocoder {
  const cache: Record<string, Promise<GeocodingResult[]>> = {};
  function get(search: string): Promise<GeocodingResult[]> {
    // caching the promise also keeps concurrent searches down to one request
    cache[search] ??= request(search).catch((error) => {
      delete cache[search]; // a failed search should be retried, not remembered
      throw error;
    });
    return cache[search];
  }
  return {
    request,
    get,
    async getBest(search, filter) {
      const data = await get(search);
      const results = filter ? data.filter(filter) : data;
      if (results.length === 0) throw new Error("No result found");
      return results[0];
    }
  };
}
