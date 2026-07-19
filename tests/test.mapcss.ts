import {describe, expect, it} from "vite-plus/test";

import styleparser from "../js/jsmapcss";

/** A minimal stand-in for the entity interface RuleChain.test() expects. */
function entity(type: string, parents: unknown[] = []) {
  return {
    isSubject: (subject: string) => subject === type,
    getParentObjects: () => parents
  };
}

function styles(css: string, type: string, tags: Record<string, string>) {
  const ruleset = new styleparser.RuleSet();
  ruleset.parseCSS(css);
  return ruleset.getStyles(entity(type), tags, 18);
}

describe("MapCSS styles", () => {
  it("applies a declaration to a matching selector", () => {
    const sl = styles("way {color: #ff0000; width: 3;}", "way", {
      highway: "primary"
    });
    expect(sl.shapeStyles.default.color).toBe("#ff0000");
    expect(sl.shapeStyles.default.width).toBe(3);
  });

  it("skips a declaration whose condition does not match", () => {
    const sl = styles("way[highway=primary] {color: #ff0000;}", "way", {
      highway: "residential"
    });
    expect(sl.shapeStyles.default).toBeUndefined();
  });

  it("sorts properties into the style subtype that owns them", () => {
    const sl = styles(
      "node {icon-image: url(foo.png); text: name; color: #00ff00;}",
      "node",
      {}
    );
    expect(sl.pointStyles.default.icon_image).toBe("url(foo.png)");
    expect(sl.textStyles.default.text).toBe("name");
    expect(sl.shapeStyles.default.color).toBe("#00ff00");
  });

  // Style defaults live on the prototype, and StyleChooser copies only own
  // properties into the StyleList. A style therefore carries *only* the
  // properties its declaration actually set — which is what keeps the merge
  // below from clobbering earlier rules with later rules' defaults.
  it("carries only explicitly set properties", () => {
    const sl = styles("way {color: #ff0000;}", "way", {});
    expect(Object.keys(sl.shapeStyles.default).sort()).toEqual([
      "color",
      "edited",
      "evals"
    ]);
  });

  it("merges later rules into earlier ones without dropping their properties", () => {
    const sl = styles(
      "way {color: #ff0000; width: 3;} way[bridge=yes] {width: 7;}",
      "way",
      {bridge: "yes"}
    );
    // width comes from the second rule, color survives from the first
    expect(sl.shapeStyles.default.width).toBe(7);
    expect(sl.shapeStyles.default.color).toBe("#ff0000");
  });

  it("evaluates eval() properties against the feature's tags", () => {
    const sl = styles("way {width: eval(\"tag('lanes')\");}", "way", {
      lanes: "4"
    });
    expect(sl.shapeStyles.default.width).toBe(4);
  });

  it("applies set-tag instructions before evaluating later rules", () => {
    const sl = styles(
      "way[highway] {set .road;} way.road {color: #0000ff;}",
      "way",
      {highway: "primary"}
    );
    expect(sl.shapeStyles.default.color).toBe("#0000ff");
  });

  it("honours zoom ranges", () => {
    const ruleset = new styleparser.RuleSet();
    ruleset.parseCSS("way|z10-12 {color: #ff0000;}");
    expect(
      ruleset.getStyles(entity("way"), {}, 11).shapeStyles.default
    ).toBeDefined();
    expect(
      ruleset.getStyles(entity("way"), {}, 15).shapeStyles.default
    ).toBeUndefined();
  });

  it("parses named and hex CSS colours", () => {
    const ruleset = new styleparser.RuleSet();
    expect(ruleset.parseCSSColor("red")).toBe(0xff0000);
    expect(ruleset.parseCSSColor("#abc")).toBe(0xaabbcc);
    expect(ruleset.parseCSSColor("#a1b2c3")).toBe(0xa1b2c3);
  });

  it("renders a text style as inline CSS", () => {
    const sl = styles("node {text: name; text-color: #123456;}", "node", {});
    const css = styleparser.TextStyle.prototype.textStyleAsCSS.call(
      sl.textStyles.default
    );
    expect(css).toContain("color: #123456");
  });

  it("rejects malformed MapCSS", () => {
    const ruleset = new styleparser.RuleSet();
    expect(() => ruleset.parseCSS("way {color: #f00;} $$$")).toThrow();
  });
});
