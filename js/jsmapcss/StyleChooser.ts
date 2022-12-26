// styleparser/StyleChooser.js

import styleparser from "./Style";

styleparser.StyleChooser = function () {
  this.ruleChains = [new styleparser.RuleChain()];
  this.styles = [];
};

styleparser.StyleChooser.prototype = {
  // UpdateStyles doesn't support image-widths yet
  // or setting maxwidth/_width
  ruleChains: [], // array of RuleChains (each one an array of Rules)
  styles: [], // array of ShapeStyle/ShieldStyle/TextStyle/PointStyle
  zoomSpecific: false, // are any of the rules zoom-specific?

  rcpos: 0,
  stylepos: 0,

  constructor() {
    // summary:		A combination of the selectors (ruleChains) and declaration (styles).
    //				For example, way[highway=footway] node[barrier=gate] { icon: gate.png; } is one StyleChooser.
  },

  currentChain() {
    return this.ruleChains[this.ruleChains.length - 1];
  },

  newRuleChain() {
    // summary:		Starts a new ruleChain in this.ruleChains.
    if (this.ruleChains[this.ruleChains.length - 1].length() > 0) {
      this.ruleChains.push(new styleparser.RuleChain());
    }
  },

  addStyles(a) {
    this.styles = this.styles.concat(a);
  },

  updateStyles(entity, tags, sl, zoom) {
    if (this.zoomSpecific) {
      sl.validAt = zoom;
    }

    // Are any of the ruleChains fulfilled?
    for (const i in this.ruleChains) {
      const c = this.ruleChains[i];
      if (c.test(-1, entity, tags, zoom)) {
        sl.addSubpart(c.subpart);

        // Update StyleList
        for (const j in this.styles) {
          const r = this.styles[j];
          let a;
          switch (r.styleType) {
            case "ShapeStyle":
              sl.maxwidth = Math.max(sl.maxwidth, r.maxwidth());
              a = sl.shapeStyles;
              break;
            case "ShieldStyle":
              a = sl.shieldStyles;
              break;
            case "TextStyle":
              a = sl.textStyles;
              break;
            case "PointStyle":
              sl.maxwidth = Math.max(sl.maxwidth, r.maxwidth());
              a = sl.pointStyles;
              break;
            case "InstructionStyle":
              if (r.breaker) {
                return;
              }
              for (const k in r.set_tags) {
                tags[k] = r.set_tags[k];
              }
              a = {}; // "dev/null" stylechooser reciever
              break;
          }
          if (r.drawn()) {
            tags[":drawn"] = "yes";
          }
          tags._width = sl.maxwidth;

          r.runEvals(tags);
          // helper function
          if (a[c.subpart]) {
            // // If there's already a style on this sublayer, then merge them
            // // (making a deep copy if necessary to avoid altering the root style)
            // if (!a[c.subpart].merged) { a[c.subpart]=extend({},a[c.subpart]); }
            extend(a[c.subpart], r);
          } else {
            // // Otherwise, just assign it
            a[c.subpart] = extend({}, r);
          }
        }
      }
    }
  }
};

function extend(destination, source) {
  for (const property in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (source.hasOwnProperty(property)) {
      destination[property] = source[property];
    }
  }
  return destination;
}
