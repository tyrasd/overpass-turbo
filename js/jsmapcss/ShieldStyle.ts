import {Style, prototypeDefaults} from "./Style";

/** The shield image drawn behind a feature's label. */
export class ShieldStyle extends Style {
  declare shield_image: string | null;
  declare shield_width: number;
  declare shield_height: number;
}

prototypeDefaults(ShieldStyle, {
  styleType: "ShieldStyle",
  properties: ["shield_image", "shield_width", "shield_height"],
  shield_image: null,
  shield_width: NaN,
  shield_height: NaN
});
