export interface BeautifulMentionsCssClassNames {
  trigger?: string;
  value?: string;
  container?: string;
  containerFocused?: string;
}

/**
 * The theme configuration for BeautifulMentions. Rules:
 * - The keys are regular expressions that match the triggers.
 * - The values are strings with CSS class names or
 *   {@link BeautifulMentionsCssClassNames} objects.
 * - Append `Focused` to the key to address the focused state.
 * - If you need to apply different styles to trigger and value,
 *   use an {@link BeautifulMentionsCssClassNames} object instead of a string.
 */
export type BeautifulMentionsTheme = Record<
  string,
  string | BeautifulMentionsCssClassNames
>;
