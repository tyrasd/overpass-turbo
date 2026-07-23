import {Style, styleString} from "./Style";

/** The label drawn for a feature, and the shield it may sit on. */
export class TextStyle extends Style {
  override styleType = "TextStyle";
  override properties = [
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
  ];

  font_family: string | null = null;
  font_size: string | null = null;
  font_style: string | null = null;
  font_variant: string | null = null;
  font_weight: string | null = null;
  max_width: string | null = null;
  shield_casing_color: string | null = null;
  shield_casing_width: string | null = null;
  shield_color: string | null = null;
  shield_frame_color: string | null = null;
  shield_frame_width: string | null = null;
  shield_image: string | null = null;
  shield_opacity: string | null = null;
  shield_shape: string | null = null;
  shield_text: string | null = null;
  text_color: string | null = null;
  text_decoration: string | null = null;
  text_halo_color: string | null = null;
  text_halo_radius = 0;
  text_offset: string | null = null;
  text_opacity: string | null = null;
  text_position: string | null = null;
  text_transform: string | null = null;
  text: string | null = null;

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
