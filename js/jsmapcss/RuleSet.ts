// RuleSet base class
// needs to cope with nested CSS files
// doesn't do untagged nodes optimisation

import {Condition, type ConditionType} from "./Condition";
import {InstructionStyle} from "./InstructionStyle";
import {PointStyle} from "./PointStyle";
import type {Entity} from "./Rule";
import {ShapeStyle} from "./ShapeStyle";
import {ShieldStyle} from "./ShieldStyle";
import type {Style, Tags} from "./Style";
import {StyleChooser} from "./StyleChooser";
import {StyleList} from "./StyleList";
import {TextStyle} from "./TextStyle";

// Regular expression tests and other constants

const WHITESPACE = /^\s+/;
const COMMENT = /\/\*.+?\*\/\s*/;
const CLASS = /^([.:]\w+)\s*/;
const NOT_CLASS = /^!([.:]\w+)\s*/;
const ZOOM = /^\|\s*z([\d-]+)\s*/i;
const GROUP = /^,\s*/i;
const CONDITION = /^\[(.+?)\]\s*/;
const OBJECT = /^(way|node|relation|line|area|canvas|\*)\s*/;
const DECLARATION = /^\{(.+?)\}\s*/;
const SUBPART = /^::(\w+)\s*/;
const UNKNOWN = /^(\S+)\s*/;

const ZOOM_MINMAX = /^(\d+)-(\d+)$/;
const ZOOM_MIN = /^(\d+)-$/;
const ZOOM_MAX = /^-(\d+)$/;
const ZOOM_SINGLE = /^(\d+)$/;

/** Condition patterns, in the order they must be tried. */
const CONDITIONS: [ConditionType, RegExp][] = [
  ["true", /^\s*([:@\w]+)\s*=\s*yes\s*$/i],
  ["false", /^\s*([:@\w]+)\s*=\s*no\s*$/i],
  ["set", /^\s*([:@\w]+)\s*$/],
  ["unset", /^\s*!([:@\w]+)\s*$/],
  ["ne", /^\s*([:@\w]+)\s*!=\s*(.+)\s*$/],
  [">", /^\s*([:@\w]+)\s*>\s*(.+)\s*$/],
  [">=", /^\s*([:@\w]+)\s*>=\s*(.+)\s*$/],
  ["<", /^\s*([:@\w]+)\s*<\s*(.+)\s*$/],
  ["<=", /^\s*([:@\w]+)\s*<=\s*(.+)\s*$/],
  ["regex", /^\s*([:@\w]+)\s*=~\/\s*(.+)\/\s*$/],
  ["eq", /^\s*([:@\w]+)\s*=\s*(.+)\s*$/]
];

// TODO: match only two matching quotes
const ASSIGNMENT_EVAL = /^\s*(\S+)\s*:\s*eval\s*\(\s*['"](.+?)['"]\s*\)\s*$/i;
const ASSIGNMENT = /^\s*(\S+)\s*:\s*(.+?)\s*$/;
const SET_TAG_EVAL = /^\s*set\s+(\S+)\s*=\s*eval\s*\(\s*'(.+?)'\s*\)\s*$/i;
const SET_TAG = /^\s*set\s+(\S+)\s*=\s*(.+?)\s*$/i;
const SET_TAG_TRUE = /^\s*set\s+(\S+)\s*$/i;
const EXIT = /^\s*exit\s*$/i;

const DASH = /-/g;
const HEX = /^#([0-9a-f]+)$/i;

/** The kind of token last consumed by {@link RuleSet.parseCSS}. */
const enum Token {
  None,
  Zoom,
  Group,
  Condition,
  Object,
  Declaration,
  Subpart
}

// TODO: hardcoded
const MAX_SCALE = 999;
const MIN_SCALE = -999;

/** A parsed MapCSS stylesheet: a list of {@link StyleChooser}s. */
export class RuleSet {
  choosers: StyleChooser[] = [];
  /** Invoked once a stylesheet has been parsed. */
  callback?: () => void;

  /** Finds the styles for a given entity. */
  getStyles(entity: Entity, tags: Tags, zoom: number): StyleList {
    const sl = new StyleList();
    for (const chooser of this.choosers) {
      chooser.updateStyles(entity, tags, sl, zoom);
    }
    return sl;
  }

  /** Parses a CSS document into a set of StyleChoosers. */
  parseCSS(css: string): void {
    let previous = Token.None; // what was the previous CSS word?
    let sc = new StyleChooser(); // currently being assembled
    this.choosers = [];
    css = css.replace(/[\r\n]/g, ""); // strip linebreaks because JavaScript doesn't have the /s modifier

    /** Starts a new StyleChooser once the previous declaration is complete. */
    const saveIfDeclared = () => {
      if (previous == Token.Declaration) {
        this.choosers.push(sc);
        sc = new StyleChooser();
      }
    };

    let o: RegExpExecArray | null;
    while (css.length > 0) {
      // CSS comment
      if ((o = COMMENT.exec(css))) {
        css = css.replace(COMMENT, "");

        // Whitespace (probably only at beginning of file)
      } else if ((o = WHITESPACE.exec(css))) {
        css = css.replace(WHITESPACE, "");

        // Class - .motorway, .builtup, :hover
      } else if ((o = CLASS.exec(css))) {
        saveIfDeclared();
        css = css.replace(CLASS, "");
        sc.currentChain().addConditionToLast(new Condition("set", o[1]));
        previous = Token.Condition;

        // Not class - !.motorway, !.builtup, !:hover
      } else if ((o = NOT_CLASS.exec(css))) {
        saveIfDeclared();
        css = css.replace(NOT_CLASS, "");
        sc.currentChain().addConditionToLast(new Condition("unset", o[1]));
        previous = Token.Condition;

        // Zoom
      } else if ((o = ZOOM.exec(css))) {
        if (previous != Token.Object && previous != Token.Condition) {
          sc.currentChain().addRule();
        }
        css = css.replace(ZOOM, "");
        const [minZoom, maxZoom] = parseZoom(o[1]);
        sc.currentChain().addZoomToLast(minZoom, maxZoom);
        sc.zoomSpecific = true;
        previous = Token.Zoom;

        // Grouping - just a comma
      } else if ((o = GROUP.exec(css))) {
        css = css.replace(GROUP, "");
        sc.newRuleChain();
        previous = Token.Group;

        // Condition - [highway=primary]
      } else if ((o = CONDITION.exec(css))) {
        saveIfDeclared();
        if (
          previous != Token.Object &&
          previous != Token.Zoom &&
          previous != Token.Condition
        ) {
          sc.currentChain().addRule();
        }
        css = css.replace(CONDITION, "");
        const condition = parseCondition(o[1]);
        if (condition) sc.currentChain().addConditionToLast(condition);
        previous = Token.Condition;

        // Object - way, node, relation
      } else if ((o = OBJECT.exec(css))) {
        // TODO: raise error if object is none of node|way|relation|line|area|canvas|* ?
        saveIfDeclared();
        css = css.replace(OBJECT, "");
        sc.currentChain().addRule(o[1]);
        previous = Token.Object;

        // Subpart - ::centreline
      } else if ((o = SUBPART.exec(css))) {
        saveIfDeclared();
        css = css.replace(SUBPART, "");
        sc.currentChain().setSubpart(o[1]);
        previous = Token.Subpart;

        // Declaration - {...}
      } else if ((o = DECLARATION.exec(css))) {
        css = css.replace(DECLARATION, "");
        sc.addStyles(parseDeclaration(o[1]));
        previous = Token.Declaration;

        // Unknown pattern
      } else if ((o = UNKNOWN.exec(css))) {
        css = css.replace(UNKNOWN, "");
        // TODO: own error class
        throw new Error(
          `Error while parsing MapCSS at "${o[1]}${
            css.length > 38 ? `${css.substr(0, 36)}...` : css
          }"`
        );
      } else {
        throw new Error(`MapCSS parsing choked on ${css}`);
      }
    }
    saveIfDeclared();
    this.callback?.();
  }

  /** Converts a CSS colour name or hex triplet to a numeric colour. */
  parseCSSColor(colorStr: string): number {
    // todo: this should be done at user (=style consumer) side (if necessary).
    // -> move to a more appropriate location
    colorStr = colorStr.toLowerCase();
    if (CSSCOLORS[colorStr]) {
      return CSSCOLORS[colorStr];
    }
    const match = HEX.exec(colorStr);
    if (match) {
      if (match[1].length == 3) {
        // repeat digits. #abc => 0xaabbcc
        const [r, g, b] = match[1];
        return Number(`0x${r}${r}${g}${g}${b}${b}`);
      } else if (match[1].length == 6) {
        return Number(`0x${match[1]}`);
      }
      return 0x000000; // as good as any
    }
    return 0;
  }
}

/** Splits a declaration body into one style per style type. */
function parseDeclaration(s: string): Style[] {
  // Create styles
  const ss = new ShapeStyle();
  const ps = new PointStyle();
  const ts = new TextStyle();
  const hs = new ShieldStyle();
  const xs = new InstructionStyle();

  const assignments: Record<string, string> = {};
  const isEval: Record<string, boolean> = {};
  let o: RegExpExecArray | null;
  for (const a of s.split(";")) {
    if ((o = ASSIGNMENT_EVAL.exec(a))) {
      const k = o[1].replace(DASH, "_");
      assignments[k] = o[2];
      isEval[k] = true;
    } else if ((o = ASSIGNMENT.exec(a))) {
      assignments[o[1].replace(DASH, "_")] = o[2];
    } else if (SET_TAG_EVAL.exec(a)) {
      // xs.addSetTag(o[1], saveEval(o[2]));
    } else if ((o = SET_TAG.exec(a))) {
      xs.addSetTag(o[1], o[2]);
    } else if ((o = SET_TAG_TRUE.exec(a))) {
      xs.addSetTag(o[1], true);
    } else if (EXIT.exec(a)) {
      xs.setPropertyFromString("breaker", true);
    }
  }

  // Assign each property to the style that accepts it
  for (const a in assignments) {
    const style = [ss, ps, ts, hs].find((style) => style.has(a));
    style?.setPropertyFromString(a, assignments[a], isEval[a]);
  }

  return [ss, ps, ts, hs, xs].filter((style) => style.edited);
}

/** Parses a `|z…` zoom range into its minimum and maximum zoom levels. */
function parseZoom(s: string): [number, number] {
  let o: RegExpExecArray | null;
  if ((o = ZOOM_MINMAX.exec(s))) {
    return [Number(o[1]), Number(o[2])];
  } else if ((o = ZOOM_MIN.exec(s))) {
    return [Number(o[1]), MAX_SCALE];
  } else if ((o = ZOOM_MAX.exec(s))) {
    return [MIN_SCALE, Number(o[1])];
  } else if ((o = ZOOM_SINGLE.exec(s))) {
    return [Number(o[1]), Number(o[1])];
  }
  return null;
}

/** Parses the body of a `[…]` selector into a {@link Condition}. */
function parseCondition(s: string): Condition | null {
  for (const [type, pattern] of CONDITIONS) {
    const o = pattern.exec(s);
    // The presence-testing patterns capture only a key, the comparing ones
    // also capture a value.
    if (o) return new Condition(type, ...o.slice(1).filter(Boolean));
  }
  return null;
}

const CSSCOLORS: Record<string, number> = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgrey: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370d8,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xd87093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};
