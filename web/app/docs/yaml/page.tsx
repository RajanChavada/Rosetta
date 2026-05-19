import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { Callout } from '@/components/docs/callout';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function YamlSchemaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="rosetta.yaml"
        description="Schema-validated, structured-data alternative to the Markdown master spec."
      />
      <Prose>
        <FadeIn>
          <section id="why">
            <h2>Why YAML-first?</h2>
            <p>
              For teams that prefer schema-validated configuration to free-form Markdown,{' '}
              <InlineCode>rosetta.yaml</InlineCode> becomes the single source of truth. The CLI compiles it into
              every IDE format. You get type safety, lint feedback, and editor autocomplete.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="schema">
            <h2>Schema overview</h2>
            <CodeBlock
              lang="yaml"
              title="rosetta.yaml"
              code={`schema_version: "1.0.0"

project:
  name: My Project
  description: A web application
  type: web_app
  risk_level: medium

stack:
  language: TypeScript
  frontend: [React, Next.js]
  backend: [Node.js, Express]
  datastores: [PostgreSQL]
  testing: [Jest, Playwright]

conventions:
  - name: API Design
    rules:
      - description: All endpoints must be versioned
        pattern: /v[0-9]+/
        enforced: true

agents:
  - name: architect
    role: Senior Architect
    style: autonomous
    scope: repo

notes:
  - title: Database Migrations
    category: gotcha
    content: Always run migrations before deploying
    priority: 9`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="workflow">
            <h2>Workflow</h2>
            <p>Validate your YAML before syncing:</p>
            <CodeBlock code="rosetta validate-config" lang="bash" />
            <p>Compile to every IDE:</p>
            <CodeBlock code="rosetta sync-yaml" lang="bash" />
            <p>Restrict to a specific set of IDEs:</p>
            <CodeBlock code="rosetta sync-yaml --ides claude,cursor --verbose" lang="bash" />
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="migrate">
            <h2>Migrating from Markdown</h2>
            <p>
              If you already have <InlineCode>.ai/master-skill.md</InlineCode>, run the one-shot migration:
            </p>
            <CodeBlock code="rosetta migrate-to-yaml --dry-run" lang="bash" />
            <Callout kind="tip" title="Dry-run first">
              The <InlineCode>--dry-run</InlineCode> flag prints what would be written without touching the
              filesystem. Always preview before committing.
            </Callout>
          </section>
        </FadeIn>
      </Prose>
    </>
  );
}
