import {describe, expect, it} from "vitest";
import {featurePopupContent} from "../js/popup";

describe("featurePopupContent", () => {
  it("", () => {
    const feature = {
      type: "Feature",
      id: "node/270198479",
      properties: {
        type: "node",
        id: "270198479",
        tags: {
          amenity: "drinking_water",
          fountain: "roman_wolf",
          wikimedia_commons:
            "File:Roman Wolf Fountain, Villa Celimontana, Roma, Italia Sep 01, 2020 12-41-19 PM.jpeg"
        },
        relations: [],
        meta: {
          timestamp: "2022-10-03T09:17:16Z",
          version: "4",
          changeset: "126925539",
          user: "Friendly_Ghost",
          uid: "10875409"
        }
      },
      geometry: {
        type: "Point",
        coordinates: [12.4947844, 41.8837598]
      }
    };
    expect(featurePopupContent(feature)).toMatchSnapshot();
  });
});
