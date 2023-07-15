export interface BeautifulMentionsThemeValues {
  trigger?: string;
  value?: string;
}

export type BeautifulMentionsTheme = Record<
  string,
  string | BeautifulMentionsThemeValues
>;
