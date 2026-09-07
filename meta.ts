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
      'find-skills': 'agent/find-skills',
    },
  },
  'anthropics': {
    source: 'https://github.com/anthropics/skills',
    skills: {
      // Agent
      'mcp-builder': 'agent/mcp-builder',
      'skill-creator': 'agent/skill-creator',
      // Document
      'docx': 'doc/docx',
      'pptx': 'doc/pptx',
      'xlsx': 'doc/xlsx',
      'pdf': 'doc/pdf',
      'doc-coauthoring': 'doc/doc-coauthoring',
      'internal-comms': 'doc/internal-comms',
      // Design
      'theme-factory': 'design/theme-factory',
      'canvas-design': 'design/canvas-design',
      'frontend-design': 'design/frontend-design',
      // Development
      'webapp-testing': 'dev/webapp-testing',
    },
  },
  'mattapocock': {
    source: 'https://github.com/mattpocock/skills',
    skills: {
      // Starup
      'engineering/ask-matt': 'starup/ask-matt',
      'engineering/setup-matt-pocock-skills': 'starup/setup-matt-pocock-skills',
      // Agent
      'productivity/writing-for-agents': 'agent/writing-for-agents',
      'productivity/handoff': 'agent/handoff',
      // Document
      'engineering/research': 'doc/research',
      'engineering/domain-modeling': 'doc/domain-modeling',
      'productivity/grilling': 'doc/grilling',
      'productivity/grill-me': 'doc/grill-me',
      'engineering/grill-with-docs': 'doc/grill-with-docs',
      'engineering/wayfinder': 'doc/wayfinder',
      'productivity/to-questionnaire': 'doc/to-questionnaire',
      'productivity/wait-what': 'doc/wait-what',
      'productivity/teach': 'doc/teach',
      'engineering/to-spec': 'doc/to-spec',
      'engineering/to-tickets': 'doc/to-tickets',
      'engineering/triage': 'doc/triage',
      // Design
      'engineering/codebase-design': 'design/codebase-design',
      'engineering/prototype': 'design/prototype',
      'engineering/improve-codebase-architecture': 'design/improve-codebase-architecture',
      // Development
      'engineering/tdd': 'dev/tdd',
      'engineering/implement': 'dev/implement',
      'engineering/code-review': 'dev/code-review',
      'engineering/diagnosing-bugs': 'dev/diagnosing-bugs',
      'engineering/wizard': 'dev/wizard',
      'engineering/resolving-merge-conflicts': 'dev/resolving-merge-conflicts',
      'misc/migrate-to-shoehorn': 'dev/migrate-to-shoehorn',
    },
  },
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      // Design
      'web-design-guidelines': 'design/web-design-guidelines',
    },
  },
}

/**
 * Hand-written skills with Anthony Fu's preferences/tastes/recommendations
 */
export const manual = [
]
