export interface BeautifulMentionsThemeValues {
  trigger?: string;
  value?: string;
  container?: string;
  containerFocused?: string;
}

/**
 * The theme configuration for BeautifulMentions. Rules:
 * - The keys are regular expressions that match the triggers.
 * - The values are strings with class names or
 *   {@link BeautifulMentionsThemeValues} objects.
 * - Append `Focused` to the key to apply styles when the trigger
 *   is focused. Limitation: the value must be a string with class names.
 * - If you need to apply different styles to trigger and value,
 *   use an {@link BeautifulMentionsThemeValues} object instead of a string.
 */
export type BeautifulMentionsTheme = Record<
  string,
  string | BeautifulMentionsThemeValues
>;
