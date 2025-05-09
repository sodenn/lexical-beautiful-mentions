import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends("next"),
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**"],
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];
