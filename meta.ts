export interface VendorSkillMeta {
  official?: boolean
  source: string
  skillsPath?: string // Optional custom path to skills directory (default: 'skills')
  licensePath?: string // Optional license file relative to the repo root (default: the first LICENSE* found at the root)
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
      // -- ANYWHERE --
      'find-skills': 'starting/find-skills',
    },
  },
  'anthropics': {
    source: 'https://github.com/anthropics/skills',
    skills: {
      // -- ANYWHERE --
      'theme-factory': 'shaping/theme-factory',
      'canvas-design': 'shaping/canvas-design',
      'frontend-design': 'shaping/frontend-design',
      'mcp-builder': 'building/mcp-builder',
      'skill-creator': 'building/skill-creator',
      'doc-coauthoring': 'reporting/doc-coauthoring',
      'internal-comms': 'reporting/internal-comms',
    },
  },
  'mattapocock': {
    source: 'https://github.com/mattpocock/skills',
    skills: {
      // -- WORKFLOW --
      'engineering/ask-matt': 'starting/ask-matt',
      'engineering/setup-matt-pocock-skills': 'starting/setup-matt-pocock-skills',
      'engineering/wayfinder': 'shaping/wayfinder',
      'engineering/prototype': 'shaping/prototype',
      'engineering/research': 'shaping/research',
      'engineering/grill-with-docs': 'shaping/grill-with-docs',
      'engineering/to-spec': 'building/to-spec',
      'engineering/to-tickets': 'building/to-tickets',
      'engineering/implement': 'building/implement',
      'engineering/implement-spec': 'building/implement-spec',
      'engineering/code-review': 'building/code-review',
      'engineering/retro': 'maintaining/retro',
      'engineering/improve-codebase-architecture': 'maintaining/improve-codebase-architecture',
      'engineering/diagnosing-bugs': 'maintaining/diagnosing-bugs',
      'engineering/triage': 'maintaining/triage',
      'misc/migrate-to-shoehorn': 'maintaining/migrate-to-shoehorn',
      // -- ANYWHERE --
      'productivity/grill-me': 'shaping/grill-me',
      'productivity/to-questionnaire': 'shaping/to-questionnaire',
      'productivity/teach': 'shaping/teach',
      'productivity/wait-what': 'shaping/wait-what',
      'engineering/wizard': 'building/wizard',
      'productivity/writing-for-agents': 'building/writing-for-agents',
      'productivity/handoff': 'maintaining/handoff',
      // -- REFERENE --
      'productivity/grilling': 'reference/grilling',
      'engineering/domain-modeling': 'reference/domain-modeling',
      'engineering/codebase-design': 'reference/codebase-design',
      'engineering/tdd': 'reference/tdd',
      'engineering/pr': 'reference/pr',
    },
  },
  'cursor-plugins': {
    source: 'https://github.com/cursor/plugins',
    skillsPath: 'pstack/skills',
    licensePath: 'pstack/LICENSE',
    skills: {
      // -- ANYWHERE --
      unslop: 'shaping/unslop',
    },
  },
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      // -- WORKFLOW --
      'web-design-guidelines': 'shaping/web-design-guidelines',
    },
  },
}

/**
 * Hand-written skills with Lumirelle's preferences/tastes/recommendations
 */
export const manual = [
  // -- WORKFLOW --
  'maintaining/justbump',
  // -- ANYWHERE
  'toolchain/mise',
  'toolchain/worktrunk',
]
