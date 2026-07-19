import {Style, prototypeDefaults} from "./Style";

/** The `set tag=value` and `exit` instructions of a MapCSS declaration. */
export class InstructionStyle extends Style {
  /** Tags to add to the feature before evaluating the remaining rules. */
  declare set_tags: Record<string, string | boolean> | null;
  /** Whether this declaration stops the feature being styled any further. */
  declare breaker: boolean;

  addSetTag(k: string, v: string | boolean): void {
    this.edited = true;
    if (!this.set_tags) this.set_tags = {};
    this.set_tags[k] = v;
  }
}

prototypeDefaults(InstructionStyle, {
  styleType: "InstructionStyle",
  set_tags: null,
  breaker: false
});
