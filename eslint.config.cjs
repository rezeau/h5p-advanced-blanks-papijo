const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'test/**']
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
