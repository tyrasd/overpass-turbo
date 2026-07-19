/*! this is mostly based on work by Richard Fairhurst, initially developed for iD editor, but abbandoned. See: http://lists.openstreetmap.org/pipermail/mapcss/2013-February/000341.html . This is under WTFPL. */

import evalparser from "./eval.pegjs";

/** The tags of the OSM feature a style is being evaluated against. */
export type Tags = Record<string, string>;

/** A value a MapCSS declaration can assign to a style property. */
export type StyleValue = string | number | boolean | number[];

/** Base class of the MapCSS style types, holding the shared property plumbing. */
export class Style {
  /** Names of the MapCSS properties this style type accepts. */
  properties: string[] = [];
  styleType = "Style";
  /** Whether any property has been assigned by a declaration. */
  edited = false;
  /** MapCSS `eval()` expressions by property name, evaluated per feature. */
  evals: Record<string, string> = {};
  /**
   * The properties a declaration actually assigned, as opposed to those still
   * holding their default.
   *
   * A style contributes only these to a {@link StyleList}, so that two
   * declarations matching the same feature can be merged without the later one
   * overwriting the earlier one with defaults it was never asked for.
   */
  readonly assigned = new Set<string>();

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
    this.assigned.add(k);
  }

  /**
   * The part of this style a declaration established, ready to be merged into
   * a {@link StyleList}.
   *
   * `evals` comes along unconditionally: consumers read it to tell a literal
   * value apart from one computed per feature.
   */
  assignedProperties(): Partial<this> {
    const properties = this as unknown as Record<string, StyleValue>;
    return {
      evals: this.evals,
      ...Object.fromEntries([...this.assigned].map((k) => [k, properties[k]]))
    } as Partial<this>;
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
      .filter((k) => this.assigned.has(k))
      .map((k) => `${k}=${properties[k]}; `)
      .join("");
  }
}

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
