import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { Callout } from '@/components/docs/callout';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function GettingStartedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Introduction"
        description="Rosetta keeps your AI agent configuration consistent across every IDE you use."
      />
      <Prose>
        <FadeIn>
          <section id="what-is-rosetta">
            <h2>What is Rosetta?</h2>
            <p>
              Rosetta is a CLI that maintains a single source of truth for AI agent rules and translates it
              into the native config format of every IDE on the supported list. Edit one file, sync everywhere.
            </p>
            <p>
              Under the hood, your master spec lives at <InlineCode>.ai/master-skill.md</InlineCode>. Rosetta reads it
              and generates <InlineCode>CLAUDE.md</InlineCode>, <InlineCode>.cursor/rules</InlineCode>,{' '}
              <InlineCode>.windsurf/rules</InlineCode>, and seven other IDE-specific files.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="why-it-exists">
            <h2>Why it exists</h2>
            <p>
              Teams use multiple AI coding assistants in parallel: Claude Code, Cursor, Windsurf, Copilot. Each one
              reads its own config. Without a single source of truth, the rules drift apart:
            </p>
            <ul>
              <li>Conventions in <InlineCode>CLAUDE.md</InlineCode> stop matching <InlineCode>.cursorrules</InlineCode>.</li>
              <li>A new team member doesn&apos;t know which IDE has the &quot;real&quot; rules.</li>
              <li>Skills written for one IDE need manual porting to work in another.</li>
              <li>Memory from yesterday&apos;s session is lost when you open a different IDE today.</li>
            </ul>
            <p>Rosetta fixes this by treating one spec as canonical and regenerating every wrapper from it.</p>
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="what-you-get">
            <h2>What you get out of the box</h2>
            <ul>
              <li>
                <strong>Master spec</strong> — a single Markdown (or YAML) file that describes your agent rules,
                memory workflow, and conventions.
              </li>
              <li>
                <strong>Three-layer memory</strong> — project facts, learned heuristics, and daily logs that persist
                across sessions and team handoffs.
              </li>
              <li>
                <strong>Ten IDE wrappers</strong> — generated automatically, kept in sync with one command.
              </li>
              <li>
                <strong>Skills system</strong> — install reusable agent skills that translate into every IDE&apos;s
                native format.
              </li>
              <li>
                <strong>Stack detection</strong> — Rosetta inspects your project and tailors the scaffold to your
                language and frameworks.
              </li>
            </ul>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Callout kind="tip" title="Next steps">
            New to Rosetta? Head to <a href="/docs/getting-started/installation">Installation</a> first,
            then run through the <a href="/docs/getting-started/quick-start">Quick start</a> in under a minute.
          </Callout>
        </FadeIn>
      </Prose>
    </>
  );
}
