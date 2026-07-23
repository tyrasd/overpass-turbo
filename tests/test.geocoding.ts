import {beforeEach, describe, expect, it, vi} from "vite-plus/test";

import {requestJson} from "../js/httpRequest";
import * as nominatim from "../js/nominatim";
import * as osmnames from "../js/osmnames";

vi.mock("../js/httpRequest", () => ({requestJson: vi.fn()}));

// the same place, as returned by either geocoder
const NOMINATIM_RESULT = {
  osm_type: "relation",
  osm_id: 62428,
  // south, north, west, east
  boundingbox: ["48.1082", "48.3254", "16.1826", "16.5775"],
  lat: "48.2083537",
  lon: "16.3725042",
  display_name: "Vienna, Austria"
};
const OSMNAMES_RESULT = {
  osm_type: "relation",
  osm_id: 62428,
  // west, south, east, north
  boundingbox: [16.1826, 48.1082, 16.5775, 48.3254],
  lat: 48.2083537,
  lon: 16.3725042,
  display_name: "Vienna, Austria"
};
// south, west, north, east
const BOUNDS = [48.1082, 16.1826, 48.3254, 16.5775];

describe("geocoding", () => {
  beforeEach(() => {
    vi.mocked(requestJson).mockReset();
  });

  describe("nominatim", () => {
    it("normalizes results", async () => {
      vi.mocked(requestJson).mockResolvedValue([NOMINATIM_RESULT]);
      expect(await nominatim.getBest("Vienna")).toEqual({
        name: "Vienna, Austria",
        lat: 48.2083537,
        lon: 16.3725042,
        bounds: BOUNDS,
        osm_type: "relation",
        osm_id: 62428
      });
    });
    it("caches searches", async () => {
      vi.mocked(requestJson).mockResolvedValue([NOMINATIM_RESULT]);
      await nominatim.get("Vienna, Austria");
      await nominatim.get("Vienna, Austria");
      expect(requestJson).toHaveBeenCalledOnce();
    });
    it("retries failed searches", async () => {
      vi.mocked(requestJson).mockRejectedValue(new Error("nope"));
      await expect(nominatim.get("Nowhere")).rejects.toThrow();
      await expect(nominatim.get("Nowhere")).rejects.toThrow();
      expect(requestJson).toHaveBeenCalledTimes(2);
    });
    it("applies the filter", async () => {
      vi.mocked(requestJson).mockResolvedValue([
        {...NOMINATIM_RESULT, osm_type: "node", osm_id: 17307406},
        NOMINATIM_RESULT
      ]);
      const result = await nominatim.getBest(
        "Vienna, node first",
        (r) => r.osm_type !== "node"
      );
      expect(result.osm_id).to.equal(62428);
    });
    it("throws if there is no result", async () => {
      vi.mocked(requestJson).mockResolvedValue([]);
      await expect(nominatim.getBest("Atlantis")).rejects.toThrow(
        "No result found"
      );
    });
  });

  describe("osmnames", () => {
    it("normalizes results", async () => {
      vi.mocked(requestJson).mockResolvedValue({results: [OSMNAMES_RESULT]});
      expect(await osmnames.getBest("Vienna")).toEqual({
        name: "Vienna, Austria",
        lat: 48.2083537,
        lon: 16.3725042,
        bounds: BOUNDS,
        osm_type: "relation",
        osm_id: 62428
      });
    });
    it("handles results without a bounding box", async () => {
      const {boundingbox: _, ...withoutBounds} = OSMNAMES_RESULT;
      vi.mocked(requestJson).mockResolvedValue({results: [withoutBounds]});
      // note: a search term which was not used before, as results are cached
      expect(
        (await osmnames.getBest("Vienna, unbounded")).bounds
      ).toBeUndefined();
    });
  });
});
