import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/code/code-block';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function QuickStartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Quick start"
        description="From zero to a synced multi-IDE setup in under a minute."
      />
      <Prose>
        <FadeIn>
          <section id="step-1">
            <h2>Step 1: Scaffold the project</h2>
            <p>Run Rosetta inside the root of an existing project:</p>
            <CodeBlock code="rosetta scaffold --auto-ideate" lang="bash" />
            <p>
              Rosetta detects your stack, writes the <InlineCode>.ai/</InlineCode> brain, and generates a config
              file for every IDE it can find:
            </p>
            <CodeBlock
              lang="plaintext"
              code={`project/
├─ .ai/
│  ├─ master-skill.md       # single source of truth
│  ├─ AGENT.md
│  ├─ task.md
│  ├─ memory/
│  │  ├─ PROJECT_MEMORY.md
│  │  └─ AUTO_MEMORY.md
│  └─ logs/daily/
├─ CLAUDE.md                # Claude Code wrapper
├─ .cursor/rules/           # Cursor wrapper
└─ .windsurf/rules/         # Windsurf wrapper`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="step-2">
            <h2>Step 2: Open your IDE</h2>
            <p>
              With <InlineCode>--auto-ideate</InlineCode>, Rosetta copies a framing prompt to your clipboard. Open
              Claude Code, Cursor, or Windsurf and paste it into the agent chat. The agent asks 3 to 5 clarifying
              questions about your domain, then proposes custom skills based on your project.
            </p>
            <Callout kind="tip" title="If clipboard didn't fire">
              You can always re-run <InlineCode>rosetta ideate</InlineCode> later. The framing prompt is also written
              to <InlineCode>.ai/skill-ideation-template.md</InlineCode>.
            </Callout>
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="step-3">
            <h2>Step 3: Approve and install generated skills</h2>
            <p>
              The agent returns one to five skill proposals in a standard format. Once you approve, install them
              directly:
            </p>
            <CodeBlock code="rosetta install https://github.com/your-org/your-skill" lang="bash" />
            <p>
              Rosetta translates the skill into each IDE&apos;s native format and updates the manifest. The same
              skill becomes available everywhere.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="step-4">
            <h2>Step 4: Use the skill</h2>
            <p>Invocation depends on the IDE:</p>
            <CodeBlock
              lang="plaintext"
              code={`Claude Code   /your-skill
Cursor        @your-skill
Windsurf      @your-skill
Codex CLI     auto-detected by SKILL.md frontmatter
Copilot       embedded in copilot-instructions.md`}
            />
            <p>
              That&apos;s it. Going forward, edit <InlineCode>.ai/master-skill.md</InlineCode> as your single source of
              truth and run <InlineCode>rosetta sync --regenerate-wrappers</InlineCode> to push changes everywhere.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Callout kind="tip" title="Keep wrappers in sync automatically">
            Run <InlineCode>rosetta watch</InlineCode> in a terminal tab. It re-renders all wrappers on every save
            to the master spec (300 ms debounce).
          </Callout>
        </FadeIn>
      </Prose>
    </>
  );
}
