import type {Condition} from "./Condition";
import {type Entity, Rule} from "./Rule";
import type {Tags} from "./Style";

/**
 * A descendant list of MapCSS selectors, for example
 *
 * ```text
 * relation[type=route] way[highway=primary]
 * ^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^
 * first Rule           second Rule
 * ```
 *
 * which together form one RuleChain.
 *
 * In contrast to Halcyon, note that length() is a function, not a getter
 * property.
 */
export class RuleChain {
  rules: Rule[] = [];
  /** Subpart name, as in `way[highway=primary]::centreline`. */
  subpart = "default";

  addRule(subject?: string): void {
    const rule = new Rule();
    rule.addSubject(subject ?? "");
    this.rules.push(rule);
  }

  addConditionToLast(condition: Condition): void {
    this.rules[this.rules.length - 1].addCondition(condition);
  }

  addZoomToLast(minZoom: number, maxZoom: number): void {
    const last = this.rules[this.rules.length - 1];
    last.minZoom = minZoom;
    last.maxZoom = maxZoom;
  }

  length(): number {
    return this.rules.length;
  }

  setSubpart(subpart: string): void {
    this.subpart = subpart || "default";
  }

  /**
   * Tests the chain by running its rules in reverse order, starting at `pos`
   * or, for -1, at the end of the chain. A separate tags object is required in
   * case the feature has been dynamically retagged.
   *
   * Once a rule passes, the rule before it is tried against each of the
   * feature's parents in turn, so that a descendant selector matches if any
   * ancestry satisfies it.
   */
  test(pos: number, entity: Entity, tags: Tags, zoom: number): boolean {
    if (this.rules.length === 0) {
      return true; // orig: { return false; } // todo: wildcard selector "*" semms broken...
    }
    if (pos == -1) {
      pos = this.rules.length - 1;
    }

    if (!this.rules[pos].test(entity, tags, zoom)) {
      return false;
    }
    if (pos === 0) {
      return true;
    }

    return entity
      .getParentObjects()
      .some((parent) => this.test(pos - 1, parent, parent.tags ?? {}, zoom));
  }
}
