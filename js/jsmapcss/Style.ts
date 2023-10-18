import evalparser from "./eval.pegjs";

const styleparser = {};
styleparser.Style = function () {
  this.__init__();
};

styleparser.Style.prototype = {
  merged: false,
  edited: false,
  //sublayer: 5, // TODO: commented out. see RuleSet.js
  //interactive: true, // TODO: commented out. see RuleSet.js
  properties: [],
  styleType: "Style",
  evals: {},

  __init__() {
    this.evals = {};
  },

  drawn() {
    return false;
  },

  has(k) {
    return this.properties.indexOf(k) > -1;
  },

  mergeWith(additional) {
    for (const prop in this.properties) {
      if (additional[prop]) {
        this[prop] = additional[prop];
      }
    }
    this.merged = true;
  },

  setPropertyFromString(k, v, isEval) {
    this.edited = true;
    if (isEval) {
      this.evals[k] = v;
      return;
    }

    if (typeof this[k] == "boolean") {
      v = Boolean(v);
    } else if (typeof this[k] == "number") {
      v = Number(v);
    } else if (this[k] && this[k].constructor == Array) {
      v = v.split(",").map((a) => Number(a));
    }
    this[k] = v;
    return true;
  },

  runEvals(tags) {
    // helper object for eval() properties
    for (const k in this.evals) {
      try {
        const evaluated = evalparser.parse(this.evals[k], {
          osm_tag: (t) => tags[t] || ""
        });
        this.setPropertyFromString(k, evaluated);
      } catch (e) {
        console.error("Error while evaluating mapcss evals", e);
      }
    }
  },

  toString() {
    let str = "";
    for (const k in this.properties) {
      // eslint-disable-next-line no-prototype-builtins
      if (this.hasOwnProperty(k)) {
        str += `${k}=${this[k]}; `;
      }
    }
    return str;
  }
};
styleparser.inherit_from_Style = function (target) {
  for (const p in styleparser.Style.prototype)
    if (target[p] === undefined) target[p] = styleparser.Style.prototype[p];
};

// ----------------------------------------------------------------------
// InstructionStyle class

styleparser.InstructionStyle = function () {
  this.__init__();
};
styleparser.InstructionStyle.prototype = {
  set_tags: null,
  breaker: false,
  styleType: "InstructionStyle",

  __init__() {},

  addSetTag(k, v) {
    this.edited = true;
    if (!this.set_tags) this.set_tags = {};
    this.set_tags[k] = v;
  }
};
styleparser.inherit_from_Style(styleparser.InstructionStyle.prototype);

// ----------------------------------------------------------------------
// PointStyle class

styleparser.PointStyle = function () {
  this.__init__();
};
styleparser.PointStyle.prototype = {
  properties: [
    "icon_image",
    "icon_width",
    "icon_height",
    "icon_opacity",
    "rotation"
  ],
  icon_image: null,
  icon_width: 0,
  icon_height: NaN,
  rotation: NaN,
  styleType: "PointStyle",

  drawn() {
    return this.icon_image !== null;
  },

  maxwidth() {
    return this.evals.icon_width ? 0 : this.icon_width;
  }
};
styleparser.inherit_from_Style(styleparser.PointStyle.prototype);

// ----------------------------------------------------------------------
// ShapeStyle class

styleparser.ShapeStyle = function () {
  this.__init__();
};

styleparser.ShapeStyle.prototype = {
  properties: [
    "width",
    "offset",
    "color",
    "opacity",
    "dashes",
    "linecap",
    "linejoin",
    "line_style",
    "fill_image",
    "fill_color",
    "fill_opacity",
    "casing_width",
    "casing_color",
    "casing_opacity",
    "casing_dashes",
    "layer",
    "render"
  ],

  width: 0,
  color: null,
  opacity: NaN,
  dashes: [],
  linecap: null,
  linejoin: null,
  line_style: null,
  fill_image: null,
  fill_color: null,
  fill_opacity: NaN,
  casing_width: NaN,
  casing_color: null,
  casing_opacity: NaN,
  casing_dashes: [],
  layer: NaN, // optional layer override (usually set by OSM tag)
  render: null, // "auto" indicates that line/area features are allowed to be rendered as points on low zoom levels; the value "native" always renders features using their native geometry type; the value "point" always renders features as points in the centroid of the feature geometry
  styleType: "ShapeStyle",

  drawn() {
    return (
      this.fill_image ||
      !isNaN(this.fill_color) ||
      this.width ||
      this.casing_width
    );
  },
  maxwidth() {
    // If width is set by an eval, then we can't use it to calculate maxwidth, or it'll just grow on each invocation...
    if (this.evals.width || this.evals.casing_width) {
      return 0;
    }
    return this.width + (this.casing_width ? this.casing_width * 2 : 0);
  },
  strokeStyler() {
    let cap, join;
    switch (this.linecap) {
      case "round":
        cap = "round";
        break;
      case "square":
        cap = "square";
        break;
      default:
        cap = "butt";
        break;
    }
    switch (this.linejoin) {
      case "bevel":
        join = "bevel";
        break;
      case "miter":
        join = 4;
        break;
      default:
        join = "round";
        break;
    }
    return {
      color: this.dojoColor(
        this.color ? this.color : 0,
        this.opacity ? this.opacity : 1
      ),
      style: "Solid", // needs to parse dashes
      width: this.width,
      cap: cap,
      join: join
    };
  },
  shapeStrokeStyler() {
    if (isNaN(this.casing_color)) {
      return {width: 0};
    }
    return {
      color: this.dojoColor(
        this.casing_color,
        this.casing_opacity ? this.casing_opacity : 1
      ),
      width: this.casing_width ? this.casing_width : 1
    };
  },
  shapeFillStyler() {
    if (isNaN(this.color)) {
      return null;
    }
    return this.dojoColor(this.color, this.opacity ? this.opacity : 1);
  },
  fillStyler() {
    return this.dojoColor(
      this.fill_color,
      this.fill_opacity ? this.fill_opacity : 1
    );
  },
  casingStyler() {
    let cap, join;
    switch (this.linecap) {
      case "round":
        cap = "round";
        break;
      case "square":
        cap = "square";
        break;
      default:
        cap = "butt";
        break;
    }
    switch (this.linejoin) {
      case "bevel":
        join = "bevel";
        break;
      case "miter":
        join = 4;
        break;
      default:
        join = "round";
        break;
    }
    return {
      color: this.dojoColor(
        this.casing_color ? this.casing_color : 0,
        this.casing_opacity ? this.casing_opacity : 1
      ),
      width: this.width + this.casing_width * 2,
      style: "Solid",
      cap: cap,
      join: join
    };
  }
};
styleparser.inherit_from_Style(styleparser.ShapeStyle.prototype);

// ----------------------------------------------------------------------
// TextStyle class

styleparser.TextStyle = function () {
  this.__init__();
};
styleparser.TextStyle.prototype = {
  properties: [
    "font_family",
    "font_size",
    "font_style",
    "font_variant",
    "font_weight",
    "max_width",
    "shield_casing_color",
    "shield_casing_width",
    "shield_color",
    "shield_frame_color",
    "shield_frame_width",
    "shield_image",
    "shield_opacity",
    "shield_shape",
    "shield_text",
    "text_color",
    "text_decoration",
    "text_halo_color",
    "text_halo_radius",
    "text_offset",
    "text_opacity",
    "text_position",
    "text_transform",
    "text"
  ],

  font_family: null,
  font_size: null,
  font_style: null,
  font_variant: null,
  font_weight: null,
  max_width: null,
  shield_casing_color: null,
  shield_casing_width: null,
  shield_color: null,
  shield_frame_color: null,
  shield_frame_width: null,
  shield_image: null,
  shield_opacity: null,
  shield_shape: null,
  shield_text: null,
  text_color: null,
  text_decoration: null,
  text_halo_color: null,
  text_halo_radius: 0,
  text_offset: null,
  text_opacity: null,
  text_position: null,
  text_transform: null,
  text: null,

  styleType: "TextStyle",

  textStyleAsCSS(): string {
    return styleString({
      borderColor: this.shield_frame_color,
      borderStyle: this.shield_frame_color ? "solid" : null,
      borderWidth: this.shield_frame_width,
      backgroundColor: this.shield_color,
      fontFamily: this.font_family,
      fontSize: this.font_size,
      fontStyle: this.font_style,
      fontVariant: this.font_variant,
      fontWeight: this.font_weight,
      maxWidth: this.max_width,
      color: this.text_color,
      textDecoration: this.text_decoration,
      textShadow:
        this.text_halo_color && this.text_halo_radius > 0
          ? `0 0 ${this.text_halo_radius}px ${this.text_halo_color}`
          : null,
      opacity: this.text_opacity,
      transform: this.text_transform
    });
  }
};
styleparser.inherit_from_Style(styleparser.TextStyle.prototype);

// ----------------------------------------------------------------------
// ShieldStyle class

styleparser.ShieldStyle = function () {
  this.__init__();
};

styleparser.ShieldStyle.prototype = {
  has(k) {
    return this.properties.indexOf(k) > -1;
  },
  properties: ["shield_image", "shield_width", "shield_height"],
  shield_image: null,
  shield_width: NaN,
  shield_height: NaN,
  styleType: "ShieldStyle"
};
styleparser.inherit_from_Style(styleparser.ShieldStyle.prototype);

// ----------------------------------------------------------------------
// End of module

export default styleparser;

export function styleString(style: Partial<CSSStyleDeclaration>) {
  return Object.entries(style)
    .filter(([_key, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`
    )
    .join(";");
}
