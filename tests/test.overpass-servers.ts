import {beforeEach, describe, expect, it, vi} from "vite-plus/test";

import {requestText} from "../js/httpRequest";
import {fetchInstances, parseInstances} from "../js/overpass-servers";

vi.mock("../js/httpRequest", () => ({requestText: vi.fn()}));

// an excerpt of https://wiki.openstreetmap.org/wiki/Overpass_API, including a
// decoy table without an "API Endpoint" column and prose mentioning
// `interpreter` outside of the tables
const WIKITEXT = `== Public Overpass API instances==
{{Note|Important: do not add <syntaxhighlight inline lang="">interpreter</syntaxhighlight>, Turbo does this automatically.}}

{| class="wikitable"
|-
! scope="col" |Language
! scope="col" |Library
|-
|Python
|overpy
|}

=== Instances with global data coverage ===

{| class="wikitable"
|-
! scope="col" |Name
! scope="col" |API Endpoint
! scope="col" |[[Attic Data|Attic data]]
! scope="col" width="40%" |Usage policy
|-
|[https://overpass-api.de/ Main Overpass API instance]
|<syntaxhighlight inline lang="">https://overpass-api.de/api/interpreter</syntaxhighlight>
| {{yes}}
|Less than 10,000 queries per day.
|-
|[https://www.geofabrik.de/data/overpass-api.html Geofabrik Overpass]
|<syntaxhighlight inline lang="">https://overpass.geofabrik.de/YOUR_API_KEY/api/interpreter</syntaxhighlight>
| {{no}}
|[https://www.geofabrik.de/data/overpass-api.html Payment required]
|}

=== Instances with data only for a specific region ===

{| class="wikitable"
|-
! scope="col" |Name
! scope="col" |Data coverage
! scope="col" |API Endpoint
! scope="col" |Hardware
|-
|[https://overpass.osm.ch/ Swiss Overpass API instance]
|Switzerland
|<syntaxhighlight inline lang="">https://overpass.osm.ch/api/interpreter</syntaxhighlight>
|12 cores, 64 GB RAM
|-
|[https://overpass.atownsend.org.uk/ Britain and Ireland Overpass Instance]
|Britain and Ireland
|<syntaxhighlight inline lang="">https://overpass.atownsend.org.uk/api/</syntaxhighlight>
|1 VM, 4 cores
|}
`;

describe("overpass-servers", () => {
  beforeEach(() => {
    vi.mocked(requestText).mockReset();
  });

  it("fetches the wiki page as raw wikitext", async () => {
    vi.mocked(requestText).mockResolvedValue(WIKITEXT);
    await fetchInstances();
    expect(requestText).toHaveBeenCalledWith(
      "https://wiki.openstreetmap.org/w/index.php?title=Overpass_API&action=raw"
    );
  });

  it("parses both instance tables", async () => {
    vi.mocked(requestText).mockResolvedValue(WIKITEXT);
    expect(await fetchInstances()).toEqual([
      {url: "https://overpass-api.de/api/", scope: "global"},
      {url: "https://overpass.geofabrik.de/YOUR_API_KEY/api/", scope: "global"},
      {url: "https://overpass.osm.ch/api/", scope: "regional"},
      {url: "https://overpass.atownsend.org.uk/api/", scope: "regional"}
    ]);
  });

  it("ignores tables without an API Endpoint column", () => {
    expect(
      parseInstances(`{| class="wikitable"
|-
! scope="col" |Name
! scope="col" |Homepage
|-
|Main instance
|https://overpass-api.de/
|}`)
    ).toEqual([]);
  });

  it("finds the endpoint column regardless of its position", () => {
    expect(
      parseInstances(`{| class="wikitable"
|-
! scope="col" |API Endpoint
! scope="col" |Name
|-
|https://overpass-api.de/api/interpreter
|Main instance
|}`)
    ).toEqual([{url: "https://overpass-api.de/api/", scope: "global"}]);
  });

  it("does not depend on the section headings", () => {
    // with both headings renamed, only the "Data coverage" column still
    // distinguishes the regional from the global table
    const renamed = WIKITEXT.replace(/^=== .* ===$/gm, "=== Instances ===");
    expect(parseInstances(renamed).map((i) => i.scope)).toEqual([
      "global",
      "global",
      "regional",
      "regional"
    ]);
  });

  it("deduplicates repeated endpoints", () => {
    expect(
      parseInstances(`{| class="wikitable"
|-
! scope="col" |API Endpoint
|-
|https://overpass-api.de/api/interpreter
|-
|https://overpass-api.de/api/
|}`)
    ).toEqual([{url: "https://overpass-api.de/api/", scope: "global"}]);
  });
});
