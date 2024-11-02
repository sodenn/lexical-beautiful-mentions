import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["*.mjs", "*.js", "lib", "vitest.config.ts"],
  },
  eslintConfigPrettier,
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: "18.3" } },
  },
  reactPlugin.configs.flat["jsx-runtime"],
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    },
  },
];
