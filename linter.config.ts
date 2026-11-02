import type { Options } from '@lumirelle/linter-config'

export const options = {
  // Oxlint reports these rules, so ESLint turns them off to avoid reporting twice.
  oxlint: { typeAware: true },
  typescript: { tsconfigPath: 'tsconfig.json' },
  ignores: ['**/vendor/**', '**/sources/**', '**/skills/**'],
} satisfies Options
