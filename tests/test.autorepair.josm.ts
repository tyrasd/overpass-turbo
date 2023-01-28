import {afterEach, describe, expect, it, vi} from "vitest";
import ide from "../js/ide";

describe("ide.autorepair.josm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  // repair non-xml output data format: xml query
  it("repair non-xml output data format (xml query)", () => {
    const examples = [
      {
        // basic case
        inp: '<osm-script output="json"></osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair --></osm-script>'
      },
      {
        // preserve other osm-script parameters
        inp: '<osm-script output="json" timeout="25"></osm-script>',
        outp: '<osm-script output="xml" timeout="25"><!-- fixed by auto repair --></osm-script>'
      },
      {
        // more complex real world example
        inp: '<osm-script output="json">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/>\n</osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair -->\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/>\n</osm-script>'
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "xml");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // repair non-xml output data format: ql query
  it("repair non-xml output data format (OverpassQL query)", () => {
    const examples = [
      {
        // basic case
        inp: "[out:json];",
        outp: "[out:xml];/*fixed by auto repair*/"
      },
      {
        // preserve whitespace
        inp: "  [ out : json ]\n;",
        outp: "  [ out : xml ]\n;/*fixed by auto repair*/"
      },
      {
        // preserve other osm-script parameters
        inp: "[out:json][timeout:25];",
        outp: "[out:xml]/*fixed by auto repair*/[timeout:25];"
      },
      {
        // more complex real world example
        inp: '/*bla*/\n[out:json];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;',
        outp: '/*bla*/\n[out:xml];/*fixed by auto repair*/\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;'
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "OverpassQL");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // repair missing xml+meta infomation: xml query
  it("repair missing meta information (xml query)", () => {
    const examples = [
      {
        // trivial case
        inp: "<print/>",
        outp: '<print mode="meta"></print><!-- fixed by auto repair -->'
      },
      {
        // trivial case 2
        inp: '<osm-script output="xml"><print/></osm-script>',
        outp: '<osm-script output="xml"><print mode="meta"></print><!-- fixed by auto repair --></osm-script>'
      },
      {
        // more complex real world example
        inp: '<osm-script output="xml">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
        outp: '<osm-script output="xml">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"></print><!-- fixed by auto repair -->\n</osm-script>'
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "xml");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // repair missing xml+meta infomation: ql query
  it("repair missing meta information (OverpassQL query)", () => {
    const examples = [
      {
        // trivial case
        inp: "out;",
        outp: "out meta;/*fixed by auto repair*/"
      },
      {
        // trivial case 2
        inp: "[out:xml];out;",
        outp: "[out:xml];out meta;/*fixed by auto repair*/"
      },
      {
        // non meta output mode
        inp: "out skel;out body;out ids;out tags;",
        outp: "out meta;/*fixed by auto repair*/out meta;/*fixed by auto repair*/out meta;/*fixed by auto repair*/out meta;/*fixed by auto repair*/"
      },
      {
        // combined with other output options
        inp: "out body qt 100;",
        outp: "out meta qt 100;/*fixed by auto repair*/"
      },
      {
        // more complex real world example
        inp: '/*bla*/\n[out:xml];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out qt;',
        outp: '/*bla*/\n[out:xml];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;/*fixed by auto repair*/'
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "OverpassQL");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // overpass complex geometries
  it("repair overpass geometry options (xml query)", () => {
    const examples = [
      {
        // center geometry
        inp: '<print mode="meta" geometry="center"/>',
        outp: '<union><item/><recurse type="down"/></union><print mode="meta"></print><!-- fixed by auto repair -->'
      },
      {
        // bounds geometry
        inp: '<print mode="meta" geometry="bounds"/>',
        outp: '<union><item/><recurse type="down"/></union><print mode="meta"></print><!-- fixed by auto repair -->'
      },
      {
        // full geometry
        inp: '<print mode="meta" geometry="full"/>',
        outp: '<union><item/><recurse type="down"/></union><print mode="meta"></print><!-- fixed by auto repair -->'
      },
      {
        // full geometry with from output mode
        inp: '<print mode="body" geometry="full"/>',
        outp: '<union><item/><recurse type="down"/></union><print mode="meta"></print><!-- fixed by auto repair -->'
      },
      {
        // full geometry with named input set
        inp: '<print from="foo" mode="meta" geometry="full"/>',
        outp: '<union into="foo"><item set="foo"/><recurse from="foo" type="down"/></union><print from="foo" mode="meta"></print><!-- fixed by auto repair -->'
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "xml");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // overpass complex geometries
  it("repair overpass geometry options (OverpassQL query)", () => {
    const examples = [
      {
        // center geometry
        inp: "out meta center;",
        outp: "(._;>;); out meta;/*fixed by auto repair*/"
      },
      {
        // bounds geometry
        inp: "out meta bb;",
        outp: "(._;>;); out meta;/*fixed by auto repair*/"
      },
      {
        // full geometry
        inp: "out meta geom;",
        outp: "(._;>;); out meta;/*fixed by auto repair*/"
      },
      {
        // combined with wrong output mode
        inp: "out body geom;",
        outp: "(._;>;); out meta;/*fixed by auto repair*/"
      },
      {
        // named input set
        inp: ".foo out meta geom;",
        outp: "(.foo;.foo >;)->.foo; .foo out meta;/*fixed by auto repair*/"
      },
      {
        // stuff in comment before out statement
        inp: "//asd fasd;\nout meta geom;",
        outp: "//asd fasd;\n(._;>;); out meta;/*fixed by auto repair*/"
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "OverpassQL");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // do not repair statements in comments
  it("do not repair statements in comments (xml query)", () => {
    const examples = [
      {
        // <print> in xml comment
        inp: "<!--<print/>-->",
        outp: "<!--<print/>-->"
      },
      {
        // <osm-script> in xml comment
        inp: "<!--<osm-script>-->",
        outp: "<!--<osm-script>-->"
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "xml");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });

  // do not repair statements in comments
  it("do not repair statements in comments (overpassQL query)", () => {
    const examples = [
      {
        // multiline comment
        inp: "/*out;*/",
        outp: "/*out;*/"
      },
      {
        // single line comment
        inp: "//out;\n",
        outp: "//out;\n"
      }
    ];
    vi.spyOn(ide, "getQueryLang").mockImplementation(() => "OverpassQL");
    for (const example of examples) {
      const setQuery = vi.spyOn(ide, "setQuery").mockImplementation(() => {});
      vi.spyOn(ide, "getRawQuery").mockImplementation(() => example.inp);
      ide.repairQuery("xml+metadata");
      expect(setQuery).toHaveBeenCalledWith(example.outp);
    }
  });
});
