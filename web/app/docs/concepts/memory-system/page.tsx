import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function MemorySystemPage() {
  return (
    <>
      <PageHeader
        eyebrow="Concepts"
        title="Memory system"
        description="A three-layer model that keeps your agents grounded across sessions."
      />
      <Prose>
        <FadeIn>
          <section id="overview">
            <h2>Overview</h2>
            <p>
              Rosetta&apos;s memory system has three layers, each with a distinct write cadence and lifespan.
              The agent reads upward (logs first, then heuristics, then project facts) and writes downward when
              it learns something new.
            </p>
            <CodeBlock
              lang="plaintext"
              code={`.ai/
├─ memory/
│  ├─ PROJECT_MEMORY.md          # layer 1 — architectural decisions, "why"
│  ├─ AUTO_MEMORY.md              # layer 2 — learned heuristics, gotchas
│  └─ tribal-knowledge-archive.md # optional append-only wisdom
├─ logs/
│  └─ daily/
│     └─ 2026-05-19.md            # layer 3 — session activity
└─ task.md                         # current active task`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="layer-1">
            <h2>Layer 1: Project memory</h2>
            <p>
              <InlineCode>PROJECT_MEMORY.md</InlineCode> holds architectural decisions and the reasoning behind
              them. The agent proposes additions before writing here, since changes have downstream impact.
            </p>
            <p>
              Typical entries: which database your repo uses and why, deployment topology, framework version
              constraints, dependency-injection conventions.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="layer-2">
            <h2>Layer 2: Auto memory</h2>
            <p>
              <InlineCode>AUTO_MEMORY.md</InlineCode> is the agent&apos;s scratchpad for heuristics it discovers
              while working. It can append freely. Examples: &quot;the staging Postgres has read-replica lag&quot;,
              &quot;the auth middleware silently drops trailing slashes&quot;.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="layer-3">
            <h2>Layer 3: Daily logs</h2>
            <p>
              Each session has its own log at <InlineCode>.ai/logs/daily/YYYY-MM-DD.md</InlineCode>. The agent
              records commands run, decisions made, and roadblocks hit. Logs roll up into AUTO_MEMORY on{' '}
              <InlineCode>rosetta sync-memory</InlineCode>.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.2}>
          <section id="rotation">
            <h2>Rotating memory</h2>
            <p>Periodically compress older logs and promote the durable signals to AUTO_MEMORY:</p>
            <CodeBlock code="rosetta sync-memory" lang="bash" />
            <p>
              The CLI walks <InlineCode>.ai/logs/daily/</InlineCode>, summarizes anything older than the retention
              window, and appends to AUTO_MEMORY.
            </p>
          </section>
        </FadeIn>
      </Prose>
    </>
  );
}
