import L from "leaflet";
import {afterEach, beforeEach, describe, expect, it, vi} from "vite-plus/test";

import ide from "../js/ide";

describe("ide.query", () => {
  let orig_codeEditor, orig_map;
  beforeEach(() => {
    orig_codeEditor = ide.codeEditor;
    ide.codeEditor = {} as typeof ide.codeEditor;
    orig_map = ide.map;
    ide.map = {
      bboxfilter: {
        isEnabled() {
          return false;
        }
      },
      getBounds() {
        return L.latLngBounds([1, 2], [3, 4]);
      },
      getCenter() {
        return L.latLng([5, 6]);
      }
    } as typeof ide.map;
  });
  afterEach(() => {
    ide.map = orig_map;
    ide.codeEditor = orig_codeEditor;
    vi.restoreAllMocks();
  });

  // expand {{parameters}} in ql query
  it("expand {{parameters}} in ql query", async () => {
    vi.spyOn(ide, "setQuery").mockImplementation(() => {});
    const examples = [
      {
        // simple expansion
        inp: "{{parameter=foo}};{{parameter}}",
        outp: ";foo"
      },
      {
        // simple non-expansion
        inp: "{{parameter1=foo}};{{parameter2}}",
        outp: ";"
      },
      {
        // multiple expansion
        inp: "{{parameter=foo}};{{parameter}}{{parameter}}",
        outp: ";foofoo"
      }
    ];
    for (const example of examples) {
      ide.codeEditor.getValue = () => example.inp;
      await expect(ide.getQuery()).resolves.toBe(example.outp);
    }
  });
  // expand {{parameters}} in xml query
  it("expand {{parameters}} in xml", async () => {
    vi.spyOn(ide, "setQuery").mockImplementation(() => {});
    const examples = [
      {
        // simple expansion
        inp: "{{parameter=foo}}<xml>{{parameter}}</xml>",
        outp: "<xml>foo</xml>"
      },
      {
        // simple non-expansion
        inp: "{{parameter1=foo}}<xml>{{parameter2}}</xml>",
        outp: "<xml></xml>"
      },
      {
        // multiple expansion
        inp: "{{parameter=foo}}<xml>{{parameter}}{{parameter}}</xml>",
        outp: "<xml>foofoo</xml>"
      }
    ];
    for (const example of examples) {
      ide.codeEditor.getValue = () => example.inp;
      await expect(ide.getQuery()).resolves.toBe(example.outp);
    }
  });
  // expand {{bbox}}
  it("expand {{bbox}}", async () => {
    vi.spyOn(ide, "setQuery").mockImplementation(() => {});
    const examples = [
      {
        // ql query
        inp: "({{bbox}})",
        outp: "(1.0000000,2.0000000,3.0000000,4.0000000)"
      },
      {
        // xml query
        inp: "<bbox-query {{bbox}}/>",
        outp:
          '<bbox-query s="1.0000000" w="2.0000000" ' +
          'n="3.0000000" e="4.0000000"/>'
      },
      {
        // xml query global bbox
        inp: '<osm-script bbox="{{bbox}}"/>',
        outp: '<osm-script bbox="1.0000000,2.0000000,3.0000000,4.0000000"/>'
      }
    ];
    for (const example of examples) {
      ide.codeEditor.getValue = () => example.inp;
      await expect(ide.getQuery()).resolves.toBe(example.outp);
    }
  });
  // expand {{wsen}}
  it("expand {{wsen}}", async () => {
    vi.spyOn(ide, "setQuery").mockImplementation(() => {});
    // same bbox as {{bbox}}, but in west,south,east,north order
    ide.codeEditor.getValue = () => "({{wsen}})";
    await expect(ide.getQuery()).resolves.toBe(
      "(2.0000000,1.0000000,4.0000000,3.0000000)"
    );
  });
  // expand {{center}}
  it("expand {{center}}", async () => {
    vi.spyOn(ide, "setQuery").mockImplementation(() => {});
    const examples = [
      {
        // ql query
        inp: "({{center}})",
        outp: "(5.0000000,6.0000000)"
      },
      {
        // xml query
        inp: "<around {{center}}/>",
        outp: '<around lat="5.0000000" lon="6.0000000"/>'
      }
    ];
    for (const example of examples) {
      ide.codeEditor.getValue = () => example.inp;
      await expect(ide.getQuery()).resolves.toBe(example.outp);
    }
  });
});
