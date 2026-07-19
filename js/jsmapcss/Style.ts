/*! this is mostly based on work by Richard Fairhurst, initially developed for iD editor, but abbandoned. See: http://lists.openstreetmap.org/pipermail/mapcss/2013-February/000341.html . This is under WTFPL. */

import evalparser from "./eval.pegjs";

/** The tags of the OSM feature a style is being evaluated against. */
export type Tags = Record<string, string>;

/** A value a MapCSS declaration can assign to a style property. */
export type StyleValue = string | number | boolean | number[];

/**
 * Assigns the default values of a style's properties to its prototype.
 *
 * The defaults deliberately do *not* live on the instances: `StyleChooser`
 * copies only own properties into a `StyleList`, so a style carries nothing
 * but the properties its declaration actually set. That is what allows two
 * declarations matching the same feature to be merged without the later one
 * overwriting the earlier one with its own defaults.
 */
export function prototypeDefaults<T>(
  style: {prototype: T},
  defaults: Partial<T>
): void {
  Object.assign(style.prototype, defaults);
}

/** Base class of the MapCSS style types, holding the shared property plumbing. */
export class Style {
  /** Names of the MapCSS properties this style type accepts. */
  declare properties: string[];
  declare styleType: string;
  /** Whether any property has been assigned by a declaration. */
  declare edited: boolean;
  /** MapCSS `eval()` expressions by property name, evaluated per feature. */
  evals: Record<string, string> = {};

  /** Whether a feature carrying this style is visible on the map. */
  drawn(): boolean {
    return false;
  }

  /** Whether this style type accepts the MapCSS property `k`. */
  has(k: string): boolean {
    return this.properties.indexOf(k) > -1;
  }

  /**
   * Assigns a property parsed out of a MapCSS declaration, coercing it to the
   * type of the property's default value.
   */
  setPropertyFromString(k: string, v: StyleValue, isEval?: boolean): void {
    this.edited = true;
    if (isEval) {
      this.evals[k] = String(v);
      return;
    }

    // Properties are addressed by name from the stylesheet, so this has to go
    // through an index signature rather than the declared fields.
    const properties = this as unknown as Record<string, StyleValue>;
    const current = properties[k];
    if (typeof current == "boolean") {
      v = Boolean(v);
    } else if (typeof current == "number") {
      v = Number(v);
    } else if (Array.isArray(current)) {
      v = String(v)
        .split(",")
        .map((a) => Number(a));
    }
    properties[k] = v;
  }

  /** Resolves this style's `eval()` properties against a feature's tags. */
  runEvals(tags: Tags): void {
    for (const k in this.evals) {
      try {
        const evaluated = evalparser.parse(this.evals[k], {
          osm_tag: (t: string) => tags[t] || ""
        }) as string;
        this.setPropertyFromString(k, evaluated);
      } catch (e) {
        console.error("Error while evaluating mapcss evals", e);
      }
    }
  }

  toString(): string {
    const properties = this as unknown as Record<string, StyleValue>;
    return this.properties
      .filter((k) => Object.hasOwn(this, k))
      .map((k) => `${k}=${properties[k]}; `)
      .join("");
  }
}

prototypeDefaults(Style, {
  properties: [],
  styleType: "Style",
  edited: false
});

/** Serialises a style declaration to an inline CSS `style` attribute value. */
export function styleString(style: Partial<CSSStyleDeclaration>) {
  return Object.entries(style)
    .filter(([_key, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`
    )
    .join(";");
}
