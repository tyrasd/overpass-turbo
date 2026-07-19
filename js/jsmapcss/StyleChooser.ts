import {InstructionStyle} from "./InstructionStyle";
import {PointStyle} from "./PointStyle";
import type {Entity} from "./Rule";
import {RuleChain} from "./RuleChain";
import {ShapeStyle} from "./ShapeStyle";
import type {Style, Tags} from "./Style";
import type {StyleList, SubpartStyles} from "./StyleList";

/**
 * A combination of selectors and a declaration. For example,
 * `way[highway=footway] node[barrier=gate] { icon: gate.png; }` is one
 * StyleChooser.
 */
export class StyleChooser {
  /** The selectors, each one a chain of rules. */
  ruleChains: RuleChain[] = [new RuleChain()];
  /** The declaration, parsed into one style per style type. */
  styles: Style[] = [];
  /** Are any of the rules zoom-specific? */
  zoomSpecific = false;

  currentChain(): RuleChain {
    return this.ruleChains[this.ruleChains.length - 1];
  }

  /** Starts a new rule chain, unless the current one is still empty. */
  newRuleChain(): void {
    if (this.currentChain().length() > 0) {
      this.ruleChains.push(new RuleChain());
    }
  }

  addStyles(a: Style[]): void {
    this.styles = this.styles.concat(a);
  }

  /** Adds this chooser's styles to `sl` if any of its selectors match. */
  updateStyles(entity: Entity, tags: Tags, sl: StyleList, zoom: number): void {
    if (this.zoomSpecific) {
      sl.validAt = zoom;
    }

    for (const c of this.ruleChains) {
      if (!c.test(-1, entity, tags, zoom)) continue;
      sl.addSubpart(c.subpart);

      for (const r of this.styles) {
        let a: SubpartStyles<Style>;
        switch (r.styleType) {
          case "ShapeStyle":
            sl.maxwidth = Math.max(sl.maxwidth, (r as ShapeStyle).maxwidth());
            a = sl.shapeStyles;
            break;
          case "ShieldStyle":
            a = sl.shieldStyles;
            break;
          case "TextStyle":
            a = sl.textStyles;
            break;
          case "PointStyle":
            sl.maxwidth = Math.max(sl.maxwidth, (r as PointStyle).maxwidth());
            a = sl.pointStyles;
            break;
          case "InstructionStyle": {
            const instruction = r as InstructionStyle;
            if (instruction.breaker) {
              return;
            }
            // `set foo` records a boolean rather than a string, which
            // conditions then compare against loosely.
            for (const k in instruction.set_tags) {
              tags[k] = instruction.set_tags[k];
            }
            a = {}; // "dev/null" stylechooser reciever
            break;
          }
        }
        if (r.drawn()) {
          tags[":drawn"] = "yes";
        }
        tags._width = sl.maxwidth;

        r.runEvals(tags);
        // Only the properties this declaration assigned are merged in, so it
        // cannot overwrite what an earlier one established with defaults it was
        // never asked for. The result stays a plain object: consumers read a
        // property as absent when it is `undefined`, which inheriting the
        // defaults would defeat.
        a[c.subpart] = {...a[c.subpart], ...r.assignedProperties()};
      }
    }
  }
}
