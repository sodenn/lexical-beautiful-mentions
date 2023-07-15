export interface BeautifulMentionsThemeValues {
  trigger?: string;
  value?: string;
}

/**
 * The theme configuration for BeautifulMentions. Rules:
 * - The keys are regular expressions that match the triggers.
 * - The values are strings with class names or objects  with a
 *   `trigger` and `value` property.
 * - Append `Focused` to the key to apply styles when the trigger
 *   is focused. Limitation: the value must be a string with class names.
 * - If you need to apply different styles to trigger and value,
 *   use an object with the `trigger` and `value` properties.
 */
export type BeautifulMentionsTheme = Record<
  string,
  string | BeautifulMentionsThemeValues
>;
