import type { Options } from '@lumirelle/linter-config'

export const options = {
  // Oxlint reports these rules, so ESLint turns them off to avoid reporting twice.
  oxlint: { typeAware: true },
  ignores: ['**/vendor/**', '**/sources/**', '**/skills/**'],
  overrides: {
    toml: {
      rules: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
        'toml/spaced-comment': ['error', 'always', { markers: [':schema'] }],
      },
    },
  },
} satisfies Options
