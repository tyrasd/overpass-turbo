// Extracts the list of public Overpass API instances from the OSM wiki.
//
// The wiki page lists the instances in two tables ("Instances with global data
// coverage" and "Instances with data only for a specific region"). Rather than
// keying off the section headings or the column order — both of which change
// with routine edits — the parser relies on two structural properties:
//
//  - the instance tables are the only wikitables with an "API Endpoint" column
//  - only the regional table has a "Data coverage" column
//
// Grepping the page for `/api/interpreter` does not work: one instance is
// listed as `https://overpass.atownsend.org.uk/api/` without the suffix, and
// the string also occurs in the prose outside of the tables.

import {requestJson} from "./httpRequest";

// the wikitext is fetched via api.php rather than `action=raw`, because only
// api.php answers with an `Access-Control-Allow-Origin` header (`origin=*`)
const WIKI_URL = new URL("https://wiki.openstreetmap.org/w/api.php");
WIKI_URL.search = new URLSearchParams({
  action: "query",
  prop: "revisions",
  rvprop: "content",
  rvslots: "main",
  titles: "Overpass_API",
  format: "json",
  formatversion: "2",
  origin: "*"
}).toString();

export interface OverpassInstance {
  /** API endpoint, normalized to a trailing slash and without `interpreter` */
  url: string;
  /** whether the instance serves the whole planet or only a single region */
  scope: "global" | "regional";
}

/** splits a wikitable row into its cells, dropping any `scope="col"` markup */
function cells(row: string): string[] {
  return row
    .split(/^[!|]/m)
    .slice(1)
    .map((cell) =>
      cell
        .split(/^[!|]{2}/m)[0]
        .replace(/^scope="col"\s*(width="[^"]*")?\s*\|/, "")
        .trim()
    );
}

/**
 * Turns `https://overpass-api.de/api/interpreter` into
 * `https://overpass-api.de/api/`, the form used in {@link configs.suggestedServers}.
 */
function normalize(url: string): string {
  return url.replace(/interpreter\/?$/, "").replace(/\/?$/, "/");
}

/** parses the instance tables out of the raw wikitext of the Overpass API page */
export function parseInstances(wikitext: string): OverpassInstance[] {
  const instances = new Map<string, OverpassInstance>();

  for (const table of wikitext.match(/^\{\|[\s\S]*?^\|\}/gm) ?? []) {
    const rows = table
      .split(/^\|-.*$/m)
      .map((row) => row.replace(/^\{\|.*$|^\|\}$/gm, "").trim())
      .filter(Boolean);
    if (!rows.length) continue;

    const headers = cells(rows[0]);
    const endpointColumn = headers.findIndex((h) => /API Endpoint/i.test(h));
    if (endpointColumn === -1) continue; // not an instance table
    const scope = headers.some((h) => /Data coverage/i.test(h))
      ? "regional"
      : "global";

    for (const row of rows.slice(1)) {
      const cell = cells(row)[endpointColumn];
      const url = cell?.replace(/<[^>]+>/g, "").match(/https?:\/\/\S+/)?.[0];
      if (!url) continue;
      const normalized = normalize(url);
      if (!instances.has(normalized))
        instances.set(normalized, {url: normalized, scope});
    }
  }

  return [...instances.values()];
}

interface WikiResponse {
  query?: {
    pages?: {revisions?: {slots?: {main?: {content?: string}}}[]}[];
  };
}

/** fetches the public Overpass API instances listed on the OSM wiki */
export async function fetchInstances(): Promise<OverpassInstance[]> {
  const response = await requestJson<WikiResponse>(WIKI_URL);
  const wikitext =
    response.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
  return wikitext ? parseInstances(wikitext) : [];
}
