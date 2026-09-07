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
  'find-skills': {
    source: 'https://github.com/vercel-labs/skills',
    skills: {
      // Agent
      'find-skills': 'find-skills',
    },
  },
  'anthropics': {
    source: 'https://github.com/anthropics/skills',
    skills: {
      // Agent
      'mcp-builder': 'mcp-builder',
      'skill-creator': 'skill-creator',
      // Document
      'docx': 'docx',
      'pptx': 'pptx',
      'xlsx': 'xlsx',
      'pdf': 'pdf',
      'doc-coauthoring': 'doc-coauthoring',
      'internal-comms': 'internal-comms',
      // Design
      'theme-factory': 'theme-factory',
      'canvas-design': 'canvas-design',
      'frontend-design': 'frontend-design',
      // Development
      'webapp-testing': 'webapp-testing',
    },
  },
  'mattapocock': {
    source: 'https://github.com/mattpocock/skills',
    skills: {
      // Starup
      'engineering/ask-matt': 'ask-matt',
      'engineering/setup-matt-pocock-skills': 'setup-matt-pocock-skills',
      // Agent
      'productivity/writing-for-agents': 'writing-for-agents',
      'productivity/handoff': 'handoff',
      // Document
      'engineering/research': 'research',
      'engineering/domain-modeling': 'domain-modeling',
      'productivity/grilling': 'grilling',
      'productivity/grill-me': 'grill-me',
      'engineering/grill-with-docs': 'grill-with-docs',
      'engineering/wayfinder': 'wayfinder',
      'productivity/to-questionnaire': 'to-questionnaire',
      'productivity/wait-what': 'wait-what',
      'productivity/teach': 'teach',
      'engineering/to-spec': 'to-spec',
      'engineering/to-tickets': 'to-tickets',
      'engineering/triage': 'triage',
      // Design
      'engineering/codebase-design': 'codebase-design',
      'engineering/prototype': 'prototype',
      'engineering/improve-codebase-architecture': 'improve-codebase-architecture',
      // Development
      'engineering/tdd': 'tdd',
      'engineering/implement': 'implement',
      'engineering/code-review': 'code-review',
      'engineering/diagnosing-bugs': 'diagnosing-bugs',
      'engineering/wizard': 'wizard',
      'engineering/resolving-merge-conflicts': 'resolving-merge-conflicts',
      'misc/migrate-to-shoehorn': 'migrate-to-shoehorn',
    },
  },
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      // Design
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}

/**
 * Hand-written skills with Anthony Fu's preferences/tastes/recommendations
 */
export const manual = [
]
