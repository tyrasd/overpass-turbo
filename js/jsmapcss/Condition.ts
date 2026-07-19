import type {Tags} from "./Style";

/** The comparison a {@link Condition} applies to a tag. */
export type ConditionType =
  | "eq"
  | "ne"
  | "regex"
  | "true"
  | "false"
  | "set"
  | "unset"
  | "<"
  | "<="
  | ">"
  | ">=";

/** A single `[…]` test of a MapCSS selector, such as `[highway=primary]`. */
export class Condition {
  /** The tag key to test, followed by the value to test it against. */
  params: string[] = [];

  constructor(
    public type: ConditionType,
    ...params: string[]
  ) {
    this.params = params;
  }

  /** Runs the condition against the supplied tags. */
  test(tags: Tags): boolean {
    const p = this.params;
    const value = tags[p[0]];
    switch (this.type) {
      case "eq":
        return value == p[1];
      case "ne":
        return value != p[1];
      case "regex":
        return value !== undefined && new RegExp(p[1], "i").test(String(value));
      case "true":
        return value == "true" || value == "yes" || value == "1";
      case "false":
        return value == "false" || value == "no" || value == "0";
      case "set":
        return value !== undefined && value !== "";
      case "unset":
        return value === undefined || value === "";
      case "<":
        return Number(value) < Number(p[1]);
      case "<=":
        return Number(value) <= Number(p[1]);
      case ">":
        return Number(value) > Number(p[1]);
      case ">=":
        return Number(value) >= Number(p[1]);
    }
    return false;
  }

  toString(): string {
    return `[${this.type}: ${this.params}]`;
  }
}
