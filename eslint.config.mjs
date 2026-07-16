import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      'package/**',
      'coverage/**',
      'eslint.config.mjs',
      'vitest.config.ts',
      'esbuild.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    settings: {
      'import-x/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@/**', group: 'internal' },
            { pattern: '@package/**', group: 'internal' },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // 同階層（./foo）は許容し、親ディレクトリ越え（../foo）だけ弾く。
              // ディレクトリ境界を跨ぐ参照はエイリアスで書かせて、ファイル移動に強くする。
              regex: String.raw`^\.\.(/|$)`,
              message: 'Use the "@/..." alias instead of a parent-relative import.',
            },
          ],
        },
      ],
    },
  },
  prettier,
];
