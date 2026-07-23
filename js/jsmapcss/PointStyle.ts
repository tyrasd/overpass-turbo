import {Style} from "./Style";

/** How a feature is drawn as a point: an icon, or an overpass turbo symbol. */
export class PointStyle extends Style {
  override styleType = "PointStyle";
  override properties = [
    "icon_image",
    "icon_width",
    "icon_height",
    "icon_opacity",
    "rotation",
    "symbol_shape",
    "symbol_size",
    "symbol_stroke_width",
    "symbol_stroke_color",
    "symbol_stroke_opacity",
    "symbol_fill_color",
    "symbol_fill_opacity"
  ];

  icon_image: string | null = null;
  icon_width = 0;
  icon_height = NaN;
  icon_opacity = NaN;
  rotation = NaN;

  /*
   * overpass turbo's own MapCSS extension: the symbol-* properties.
   * TODO: implement symbol-shape = marker|square?|shield?|...
   */
  symbol_shape = "";
  symbol_size = NaN;
  symbol_stroke_width = NaN;
  symbol_stroke_color: string | null = null;
  symbol_stroke_opacity = NaN;
  symbol_fill_color: string | null = null;
  symbol_fill_opacity = NaN;

  override drawn(): boolean {
    return this.icon_image !== null;
  }

  maxwidth(): number {
    return this.evals.icon_width ? 0 : this.icon_width;
  }
}
