import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { Callout } from '@/components/docs/callout';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function MasterSpecPage() {
  return (
    <>
      <PageHeader
        eyebrow="Concepts"
        title="Master spec"
        description="The single source of truth for every agent in your repo."
      />
      <Prose>
        <FadeIn>
          <section id="what">
            <h2>What it is</h2>
            <p>
              The master spec lives at <InlineCode>.ai/master-skill.md</InlineCode>. Every IDE wrapper Rosetta
              generates is rendered from this file. When you want to change agent behavior, you edit one place.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="anatomy">
            <h2>Anatomy</h2>
            <p>A typical master spec has five sections:</p>
            <ul>
              <li><strong>Core persona</strong> — the role the agent plays and its primary objectives.</li>
              <li><strong>Reasoning framework</strong> — the lenses (architecture, workflow, risk) applied before action.</li>
              <li><strong>Standard operating procedures</strong> — repeatable workflow steps.</li>
              <li><strong>Project guardrails</strong> — risk tier, stack-specific rules, permission boundaries.</li>
              <li><strong>Memory workflow</strong> — how the agent reads from and writes to the memory layers.</li>
            </ul>
            <CodeBlock
              lang="markdown"
              title=".ai/master-skill.md (excerpt)"
              code={`# Project Rules

## Core Persona
You are a Senior Solutions Architect. Treat each interaction as a design workshop.

## Reasoning Framework
Apply these lenses before any change:
- Architecture: module boundaries, coupling, data flow.
- Workflow: reduce dev toil, automate repetitive cognitive tasks.
- Risk: defend against regressions, security flaws, performance bottlenecks.

## Standard Operating Procedures
1. Sync state with \`rosetta sync\`.
2. Read \`.ai/task.md\` and \`AUTO_MEMORY.md\` before acting.
3. Propose a design before non-trivial changes.
4. Run unit, integration, and E2E tests before declaring success.`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="regenerate">
            <h2>Regenerating wrappers</h2>
            <p>
              After editing the spec, push the changes to every IDE wrapper with one command:
            </p>
            <CodeBlock code="rosetta sync --regenerate-wrappers" lang="bash" />
            <p>
              Or run <InlineCode>rosetta watch</InlineCode> to regenerate on every save. The CLI uses a 300 ms
              debounce so rapid edits don&apos;t thrash the file system.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Callout kind="tip" title="Prefer YAML?">
            If you&apos;d rather author the master spec as structured data, use the YAML-first flow.
            See <a href="/docs/yaml">rosetta.yaml</a>.
          </Callout>
        </FadeIn>
      </Prose>
    </>
  );
}
