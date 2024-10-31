/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser', // Specify ESLint parser
  plugins: ['@typescript-eslint'], // Add the TypeScript plugin
  extends: [
    'eslint:recommended', // Use recommended rules
    'plugin:@typescript-eslint/recommended', // Use recommended rules from the @typescript-eslint/eslint-plugin
  ],
  rules: {
    // You can define your own rules here
    // e.g., '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    // Optional settings
    'import/resolver': {
      typescript: {}, // This loads <rootdir>/tsconfig.json to eslint
    },
  },
};
