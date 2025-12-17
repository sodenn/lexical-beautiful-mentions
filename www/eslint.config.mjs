import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
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
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**"],
  }, 
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "import/no-anonymous-default-export": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "playwright/no-skipped-test": "off",
      "playwright/no-useless-not": "off",
      "playwright/no-conditional-in-test": "off",
      "playwright/no-conditional-expect": "off",
      "playwright/valid-title": "off",
      "playwright/expect-expect": "off",
      "playwright/no-wait-for-timeout": "off",
      "react-hooks/refs": "off",
    },
  }, 
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];
