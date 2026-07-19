import {Style} from "./Style";

/** The `set tag=value` and `exit` instructions of a MapCSS declaration. */
export class InstructionStyle extends Style {
  override styleType = "InstructionStyle";
  /** Tags to add to the feature before evaluating the remaining rules. */
  set_tags: Record<string, string | boolean> | null = null;
  /** Whether this declaration stops the feature being styled any further. */
  breaker = false;

  addSetTag(k: string, v: string | boolean): void {
    this.edited = true;
    if (!this.set_tags) this.set_tags = {};
    this.set_tags[k] = v;
  }
}
