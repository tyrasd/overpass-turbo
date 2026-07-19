import {Style, prototypeDefaults} from "./Style";

/** How a feature's geometry is stroked and filled. */
export class ShapeStyle extends Style {
  declare width: number;
  declare offset: number;
  declare color: string | null;
  declare opacity: number;
  declare dashes: number[];
  declare linecap: string | null;
  declare linejoin: string | null;
  declare line_style: string | null;
  declare fill_image: string | null;
  declare fill_color: string | null;
  declare fill_opacity: number;
  declare casing_width: number;
  declare casing_color: string | null;
  declare casing_opacity: number;
  declare casing_dashes: number[];
  /** Optional layer override, usually set by the OSM `layer` tag. */
  declare layer: number;
  /**
   * `auto` allows line and area features to be drawn as points at low zoom
   * levels, `native` always uses the feature's own geometry type, and `point`
   * always draws the feature at the centroid of its geometry.
   */
  declare render: string | null;

  override drawn(): boolean {
    return Boolean(
      this.fill_image ||
      !isNaN(Number(this.fill_color)) ||
      this.width ||
      this.casing_width
    );
  }

  maxwidth(): number {
    // If width is set by an eval, then we can't use it to calculate maxwidth,
    // or it'll just grow on each invocation...
    if (this.evals.width || this.evals.casing_width) {
      return 0;
    }
    return this.width + (this.casing_width ? this.casing_width * 2 : 0);
  }
}

prototypeDefaults(ShapeStyle, {
  styleType: "ShapeStyle",
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
  offset: NaN,
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
  layer: NaN,
  render: null
});
