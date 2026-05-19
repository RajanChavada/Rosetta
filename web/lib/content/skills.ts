export type SkillCard = {
  name: string;
  displayName: string;
  description: string;
  domains: string[];
  tags: string[];
};

export const FEATURED_SKILLS: SkillCard[] = [
  {
    name: 'node-express-postgres',
    displayName: 'Node + Express + Postgres',
    description:
      'Full-stack Node.js with Express and PostgreSQL: database management, REST patterns, IDE integration.',
    domains: ['backend', 'api'],
    tags: ['node', 'express', 'postgres'],
  },
  {
    name: 'frontend-react-next',
    displayName: 'React + Next.js',
    description:
      'Modern web applications with React and Next.js. App Router patterns, server components, data fetching.',
    domains: ['frontend'],
    tags: ['react', 'next'],
  },
  {
    name: 'testing-full-pyramid',
    displayName: 'Full Test Pyramid',
    description:
      'Unit, integration, and E2E testing strategy. Jest + Supertest + Playwright. Mocking and fixtures.',
    domains: ['testing'],
    tags: ['jest', 'playwright'],
  },
  {
    name: 'data-ml-project',
    displayName: 'Data & ML Project',
    description:
      'Data pipelines and ML model scaffolding. Notebook conventions, training scripts, evaluation.',
    domains: ['data', 'ml'],
    tags: ['data', 'ml'],
  },
  {
    name: 'agentic-memory',
    displayName: 'Agentic Memory',
    description:
      'Three-layer memory and knowledge tracking. Auto-log conventions, archive rotation, tribal knowledge.',
    domains: ['knowledge'],
    tags: ['memory'],
  },
];
