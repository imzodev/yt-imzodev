import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astroPlugin.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
