import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.next', 'out']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // `process.env` is available in Next.js on both the server and the
      // client, where the bundler inlines it at build time.
      globals: { ...globals.browser, process: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // App Router pages are required to export route config alongside the
      // component (`export const metadata`, `generateStaticParams`, …), which
      // the stock react-refresh preset flags. Allow Next's reserved names
      // rather than leaving every page permanently failing lint.
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: [
            'metadata',
            'generateMetadata',
            'generateStaticParams',
            'generateViewport',
            'viewport',
            'dynamic',
            'dynamicParams',
            'revalidate',
            'fetchCache',
            'runtime',
            'preferredRegion',
            'maxDuration',
          ],
        },
      ],
    },
  },
])
