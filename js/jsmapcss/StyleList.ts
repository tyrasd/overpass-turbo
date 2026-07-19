import type {PointStyle} from "./PointStyle";
import type {ShapeStyle} from "./ShapeStyle";
import type {ShieldStyle} from "./ShieldStyle";
import type {TextStyle} from "./TextStyle";

/**
 * The styles that apply to one feature, keyed by subpart.
 *
 * The styles are plain copies rather than {@link Style} instances: a
 * `StyleChooser` copies each matching style's own properties in, so that
 * several declarations can be merged onto the same subpart.
 */
export type SubpartStyles<T> = Record<string, Partial<T>>;

/** The result of matching a {@link RuleSet} against a single feature. */
export class StyleList {
  shapeStyles: SubpartStyles<ShapeStyle> = {};
  textStyles: SubpartStyles<TextStyle> = {};
  pointStyles: SubpartStyles<PointStyle> = {};
  shieldStyles: SubpartStyles<ShieldStyle> = {};

  maxwidth = 0;
  /** The subparts used in this StyleList. */
  subparts: string[] = [];
  /** Zoom level this is valid at, or -1 at all levels — saves recomputing. */
  validAt = -1;

  /** Does this StyleList contain any styles? */
  hasStyles(): boolean {
    return (
      this.hasShapeStyles() ||
      this.hasTextStyles() ||
      this.hasPointStyles() ||
      this.hasShieldStyles()
    );
  }

  /** If this StyleList manually forces an OSM layer, return it. */
  layerOverride(): number {
    for (const s in this.shapeStyles) {
      const layer = this.shapeStyles[s].layer;
      if (!isNaN(layer)) return layer;
    }
    return NaN;
  }

  /** Records that a subpart is used in this StyleList. */
  addSubpart(s: string): void {
    if (this.subparts.indexOf(s) == -1) {
      this.subparts.push(s);
    }
  }

  isValidAt(zoom: number): boolean {
    return this.validAt == -1 || this.validAt == zoom;
  }

  /** Summarises the StyleList as a string, for debugging. */
  toString(): string {
    const section = (label: string, styles: SubpartStyles<unknown>) =>
      Object.entries(styles)
        .map(([k, style]) => `- ${label} ${k}=${style}\n`)
        .join("");
    return (
      section("SS", this.shapeStyles) +
      section("TS", this.textStyles) +
      section("PS", this.pointStyles) +
      section("sS", this.shieldStyles)
    );
  }

  hasShapeStyles(): boolean {
    return Object.keys(this.shapeStyles).length > 0;
  }

  hasTextStyles(): boolean {
    return Object.keys(this.textStyles).length > 0;
  }

  hasPointStyles(): boolean {
    return Object.keys(this.pointStyles).length > 0;
  }

  hasShieldStyles(): boolean {
    return Object.keys(this.shieldStyles).length > 0;
  }
}
