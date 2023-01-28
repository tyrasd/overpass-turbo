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
  it("", () => {
    const feature = {
      type: "Feature",
      id: "relation/1243821",
      properties: {
        type: "relation",
        id: "1243821",
        tags: {
          architect: "André and Jean Polak",
          "architect:wikidata": "Q2848896",
          building: "yes",
          "contact:email": "info@atomium.be",
          "contact:phone": "+32 2 475 47 75",
          "contact:website": "https://www.atomium.be/",
          engineer: "André Waterkeyn",
          "engineer:wikidata": "Q523346",
          height: "102",
          image:
            "https://images.mapillary.com/dWS3qotev3rzfk3zwkB0nu/thumb-2048.jpg",
          layer: "1",
          mapillary: "291574785922785",
          name: "Atomium",
          start_date: "1958",
          "toilets:wheelchair": "yes",
          tourism: "attraction",
          type: "multipolygon",
          wheelchair: "limited",
          wikidata: "Q180901",
          wikipedia: "fr:Atomium"
        },
        relations: [],
        meta: {},
        geometry: "center"
      },
      geometry: {
        type: "Point",
        coordinates: [4.3415237, 50.894924]
      }
    };
    expect(featurePopupContent(feature)).toMatchSnapshot();
  });
});
