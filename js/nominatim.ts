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

/** node style callback, receiving either an error message or a result */
type Callback<T> = (error: string | undefined, result: T | null) => void;

/** narrows down the results to those usable in the current context */
type Filter = (result: NominatimResult) => unknown;

const cache: Record<string, NominatimResult[]> = {};

/** queries nominatim, bypassing the cache */
export function request(
  search: string,
  callback: Callback<NominatimResult[]>
): void {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("X-Requested-With", configs.appname);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", search);
  requestJson<NominatimResult[]>(url).then(
    (data) => {
      cache[search] = data;
      callback(undefined, data);
    },
    (error) => {
      const err =
        "An error occurred while contacting the osm search server nominatim.openstreetmap.org :(";
      console.log(err, error);
      callback(err, null);
    }
  );
}

/** returns all results for `search`, from the cache if it was queried before */
export function get(
  search: string,
  callback: Callback<NominatimResult[]>
): void {
  if (cache[search] === undefined) request(search, callback);
  else callback(undefined, cache[search]);
}

/** returns the first result for `search` that passes the optional `filter` */
export function getBest(
  search: string,
  callback: Callback<NominatimResult>
): void;
export function getBest(
  search: string,
  filter: Filter,
  callback: Callback<NominatimResult>
): void;
export function getBest(
  search: string,
  filter: Filter | Callback<NominatimResult>,
  callback?: Callback<NominatimResult>
): void {
  // shift parameters if filter is omitted
  const cb = callback ?? (filter as Callback<NominatimResult>);
  const resultFilter = callback ? (filter as Filter) : null;
  get(search, (err, data) => {
    if (err) {
      cb(err, null);
      return;
    }
    const results = resultFilter ? data.filter(resultFilter) : data;
    if (results.length === 0) cb("No result found", null);
    else cb(undefined, results[0]);
  });
}
