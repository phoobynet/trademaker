import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['**/coverage/**', '**/dist/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['apps/workbench/**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        babelOptions: {
          babelrc: false,
          configFile: false,
          plugins: ['@babel/plugin-syntax-typescript'],
        },
        requireConfigFile: false,
        sourceType: 'module',
      },
    },
  },
  ...vue.configs['flat/recommended'],
  {
    files: ['apps/workbench/**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: babelParser,
        babelOptions: {
          babelrc: false,
          configFile: false,
          plugins: ['@babel/plugin-syntax-typescript'],
        },
        requireConfigFile: false,
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
];
