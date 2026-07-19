import {Style} from "./Style";

/** The shield image drawn behind a feature's label. */
export class ShieldStyle extends Style {
  override styleType = "ShieldStyle";
  override properties = ["shield_image", "shield_width", "shield_height"];

  shield_image: string | null = null;
  shield_width = NaN;
  shield_height = NaN;
}
