import js from '@eslint/js';
import ts from 'typescript-eslint';
import oclif from 'eslint-config-oclif';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'oclif.manifest.json'],
  },

  // Base ESLint recommended
  js.configs.recommended,

  // TypeScript configuration
  ...ts.configs.recommended,

  // oclif configuration (official style guide)
  ...oclif,

  // Project-specific overrides
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // TypeScript-specific - relaxed for practical CLI development
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Node.js
      'n/no-process-exit': 'off',

      // General
      'no-console': 'off', // CLI needs console output
    },
  },

  // Test files - more permissive
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
