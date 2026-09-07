// @ts-check
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    toml: {
      overrides: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
        'toml/spaced-comment': ['error', 'always', { markers: [':schema'] }],
      },
    },
    ignores: [
      '**/vendor/**',
      '**/sources/**',
      '**/skills/**',
    ],
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
