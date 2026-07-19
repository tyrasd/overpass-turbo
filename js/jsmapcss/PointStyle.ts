import {Style, prototypeDefaults} from "./Style";

/** How a feature is drawn as a point: an icon, or an overpass turbo symbol. */
export class PointStyle extends Style {
  declare icon_image: string | null;
  declare icon_width: number;
  declare icon_height: number;
  declare icon_opacity: number;
  declare rotation: number;

  /*
   * overpass turbo's own MapCSS extension: the symbol-* properties.
   * TODO: implement symbol-shape = marker|square?|shield?|...
   */
  declare symbol_shape: string;
  declare symbol_size: number;
  declare symbol_stroke_width: number;
  declare symbol_stroke_color: string | null;
  declare symbol_stroke_opacity: number;
  declare symbol_fill_color: string | null;
  declare symbol_fill_opacity: number;

  override drawn(): boolean {
    return this.icon_image !== null;
  }

  maxwidth(): number {
    return this.evals.icon_width ? 0 : this.icon_width;
  }
}

prototypeDefaults(PointStyle, {
  styleType: "PointStyle",
  properties: [
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
  ],
  icon_image: null,
  icon_width: 0,
  icon_height: NaN,
  rotation: NaN,
  symbol_shape: "",
  symbol_size: NaN,
  symbol_stroke_width: NaN,
  symbol_stroke_color: null,
  symbol_stroke_opacity: NaN,
  symbol_fill_color: null,
  symbol_fill_opacity: NaN
});
