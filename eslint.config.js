import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json', './e2e/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      // Komponen pembungkus <a>: aturan tautan jsx-a11y ikut memeriksanya.
      'jsx-a11y': { components: { Link: 'a', ButtonLink: 'a' } },
    },
    rules: {
      // <Link> memakai prop `to` (bukan `href`); tetap diperiksa sebagai tautan.
      'jsx-a11y/anchor-is-valid': [
        'error',
        { components: ['Link', 'ButtonLink'], specialLink: ['to'] },
      ],
      // Handler async pada prop JSX (mis. onSubmit) sudah umum dan aman di React.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Berkas uji: aturan Testing Library (kueri berbasis role/label, tanpa akses DOM langsung).
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    extends: [testingLibrary.configs['flat/react']],
    rules: {
      // Uji sengaja memeriksa atribut/DOM yang tidak punya role (mis. <head>, <time>, <svg>).
      'testing-library/no-node-access': 'off',
      'testing-library/no-container': 'off',
      // vi.mock/vi.spyOn pada modul sudah diketik lewat vi.mocked; berkas ini hanya kode uji.
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Uji end-to-end Playwright
  {
    files: ['e2e/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    languageOptions: { globals: globals.node },
  },

  // Kode sisi build (Node)
  {
    files: ['vite.config.ts', 'playwright.config.ts', 'vite-plugins/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Berkas konfigurasi JS biasa: tanpa aturan berbasis tipe.
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);
