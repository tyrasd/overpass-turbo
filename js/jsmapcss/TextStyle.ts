import {Style, prototypeDefaults, styleString} from "./Style";

/** The label drawn for a feature, and the shield it may sit on. */
export class TextStyle extends Style {
  declare font_family: string | null;
  declare font_size: string | null;
  declare font_style: string | null;
  declare font_variant: string | null;
  declare font_weight: string | null;
  declare max_width: string | null;
  declare shield_casing_color: string | null;
  declare shield_casing_width: string | null;
  declare shield_color: string | null;
  declare shield_frame_color: string | null;
  declare shield_frame_width: string | null;
  declare shield_image: string | null;
  declare shield_opacity: string | null;
  declare shield_shape: string | null;
  declare shield_text: string | null;
  declare text_color: string | null;
  declare text_decoration: string | null;
  declare text_halo_color: string | null;
  declare text_halo_radius: number;
  declare text_offset: string | null;
  declare text_opacity: string | null;
  declare text_position: string | null;
  declare text_transform: string | null;
  declare text: string | null;

  /**
   * Renders this style as an inline CSS `style` attribute value.
   *
   * Styles reach the map as plain objects copied out of a `StyleList`, so this
   * is called with `Function.prototype.call` on something that is not
   * necessarily a `TextStyle` instance.
   */
  textStyleAsCSS(this: Partial<TextStyle>): string {
    return styleString({
      borderColor: this.shield_frame_color,
      borderStyle: this.shield_frame_color ? "solid" : null,
      borderWidth: this.shield_frame_width,
      backgroundColor: this.shield_color,
      fontFamily: this.font_family,
      fontSize: this.font_size,
      fontStyle: this.font_style,
      fontVariant: this.font_variant,
      fontWeight: this.font_weight,
      maxWidth: this.max_width,
      color: this.text_color,
      textDecoration: this.text_decoration,
      textShadow:
        this.text_halo_color && this.text_halo_radius > 0
          ? `0 0 ${this.text_halo_radius}px ${this.text_halo_color}`
          : null,
      opacity: this.text_opacity,
      transform: this.text_transform
    });
  }
}

prototypeDefaults(TextStyle, {
  styleType: "TextStyle",
  properties: [
    "font_family",
    "font_size",
    "font_style",
    "font_variant",
    "font_weight",
    "max_width",
    "shield_casing_color",
    "shield_casing_width",
    "shield_color",
    "shield_frame_color",
    "shield_frame_width",
    "shield_image",
    "shield_opacity",
    "shield_shape",
    "shield_text",
    "text_color",
    "text_decoration",
    "text_halo_color",
    "text_halo_radius",
    "text_offset",
    "text_opacity",
    "text_position",
    "text_transform",
    "text"
  ],
  font_family: null,
  font_size: null,
  font_style: null,
  font_variant: null,
  font_weight: null,
  max_width: null,
  shield_casing_color: null,
  shield_casing_width: null,
  shield_color: null,
  shield_frame_color: null,
  shield_frame_width: null,
  shield_image: null,
  shield_opacity: null,
  shield_shape: null,
  shield_text: null,
  text_color: null,
  text_decoration: null,
  text_halo_color: null,
  text_halo_radius: 0,
  text_offset: null,
  text_opacity: null,
  text_position: null,
  text_transform: null,
  text: null
});
