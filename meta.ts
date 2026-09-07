export interface VendorSkillMeta {
  official?: boolean
  source: string
  skillsPath?: string // Optional custom path to skills directory (default: 'skills')
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}

/**
 * Repositories to clone as submodules and generate skills from source
 */
export const submodules = {
}

/**
 * Already generated skills, sync with their `skills/` directory
 */
export const vendors: Record<string, VendorSkillMeta> = {
  'mattapocock': {
    source: 'https://github.com/mattpocock/skills.git',
    skills: {
      'engineering/ask-matt': 'ask-matt',
      'engineering/code-review': 'code-review',
      'engineering/codebase-design': 'codebase-design',
      'engineering/diagnosing-bugs': 'diagnosing-bugs',
      'engineering/domain-modeling': 'domain-modeling',
      'engineering/grill-with-docs': 'grill-with-docs',
      'engineering/implement': 'implement',
      'engineering/improve-codebase-architecture': 'improve-codebase-architecture',
      'engineering/prototype': 'prototype',
      'engineering/research': 'research',
      'engineering/resolving-merge-conflicts': 'resolving-merge-conflicts',
      'engineering/setup-matt-pocock-skills': 'setup-matt-pocock-skills',
      'engineering/tdd': 'tdd',
      'engineering/to-spec': 'to-spec',
      'engineering/to-tickets': 'to-tickets',
      'engineering/triage': 'triage',
      'engineering/wayfinder': 'wayfinder',
      'engineering/wizard': 'wizard',
      'productivity/grill-me': 'grill-me',
      'productivity/grilling': 'grilling',
      'productivity/handoff': 'handoff',
      'productivity/teach': 'teach',
      'productivity/to-questionnaire': 'to-questionnaire',
      'productivity/wait-what': 'wait-what',
      'productivity/writing-for-agents': 'writing-for-agents',
      'misc/migrate-to-shoehorn': 'migrate-to-shoehorn',
    },
  },
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}

/**
 * Hand-written skills with Anthony Fu's preferences/tastes/recommendations
 */
export const manual = [
]
