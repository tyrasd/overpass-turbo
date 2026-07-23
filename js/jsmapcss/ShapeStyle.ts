import {Style} from "./Style";

/** How a feature's geometry is stroked and filled. */
export class ShapeStyle extends Style {
  override styleType = "ShapeStyle";
  override properties = [
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
  ];

  width = 0;
  offset = NaN;
  color: string | null = null;
  opacity = NaN;
  dashes: number[] = [];
  linecap: string | null = null;
  linejoin: string | null = null;
  line_style: string | null = null;
  fill_image: string | null = null;
  fill_color: string | null = null;
  fill_opacity = NaN;
  casing_width = NaN;
  casing_color: string | null = null;
  casing_opacity = NaN;
  casing_dashes: number[] = [];
  /** Optional layer override, usually set by the OSM `layer` tag. */
  layer = NaN;
  /**
   * `auto` allows line and area features to be drawn as points at low zoom
   * levels, `native` always uses the feature's own geometry type, and `point`
   * always draws the feature at the centroid of its geometry.
   */
  render: string | null = null;

  override drawn(): boolean {
    return Boolean(
      this.fill_image || this.fill_color || this.width || this.casing_width
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
