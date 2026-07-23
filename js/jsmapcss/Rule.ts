import type {Condition} from "./Condition";
import type {Tags} from "./Style";

/** The map feature a rule is evaluated against. */
export interface Entity {
  /** Whether the feature is of the given type: `way`, `node`, `relation`, … */
  isSubject(subject: string): boolean;
  /** The features this one belongs to, used to walk a descendant selector. */
  getParentObjects(): Entity[];
  tags?: Tags;
}

/**
 * A MapCSS selector: a list of conditions, the entity type they apply to, and
 * the zoom levels at which they hold. `way[waterway=river][boat=yes]` is one
 * Rule. Rules and a declaration together form a {@link StyleChooser}.
 */
export class Rule {
  /** The conditions that must hold for the rule to be fulfilled. */
  conditions: Condition[] = [];
  /** Minimum zoom level at which the rule is fulfilled. */
  minZoom = 0;
  /** Maximum zoom level at which the rule is fulfilled. */
  maxZoom = 255;
  /**
   * Entity type the rule applies to: `way`, `node`, `relation`, `area` (a
   * closed way), `line` (an unclosed way), or `*` for everything.
   */
  subject = "";

  addSubject(subject: string): void {
    this.subject = subject;
    this.conditions = [];
  }

  addCondition(condition: Condition): void {
    this.conditions.push(condition);
  }

  /** Whether the rule holds for the given entity, tags and zoom level. */
  test(entity: Entity, tags: Tags, zoom: number): boolean {
    if (this.subject !== "" && !entity.isSubject(this.subject)) {
      return false;
    }
    if (zoom < this.minZoom || zoom > this.maxZoom) {
      return false;
    }
    // MapCSS only ever ands conditions together.
    return this.conditions.every((condition) => condition.test(tags));
  }

  toString(): string {
    return `${this.subject} z${this.minZoom}-${this.maxZoom}: ${this.conditions}`;
  }
}
