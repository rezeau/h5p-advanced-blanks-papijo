import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Add the rule here
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Added no-console rule
    },
  },
  
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];