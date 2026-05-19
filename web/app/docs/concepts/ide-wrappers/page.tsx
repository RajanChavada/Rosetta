import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { IdeMatrix } from '@/components/docs/ide-matrix';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';
import { IDES } from '@/lib/content/ides';

export default function IdeWrappersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Concepts"
        title="IDE wrappers"
        description="Each IDE reads its own configuration format. Rosetta generates all of them from one spec."
      />
      <Prose>
        <FadeIn>
          <section id="what">
            <h2>What a wrapper is</h2>
            <p>
              A wrapper is the file Rosetta writes that adapts your master spec into a format a specific IDE knows
              how to read. <InlineCode>CLAUDE.md</InlineCode> is the wrapper for Claude Code. The{' '}
              <InlineCode>.cursor/rules/</InlineCode> directory contains wrappers for Cursor. Each is fully derived
              from <InlineCode>.ai/master-skill.md</InlineCode>; you should never edit a wrapper directly.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="matrix">
            <h2>Supported IDEs</h2>
            <p>Ten IDEs are supported today. Each has its own config path, skills directory, and invocation syntax:</p>
            <IdeMatrix ides={IDES} />
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="regenerate">
            <h2>Regenerating wrappers</h2>
            <p>Three ways to keep wrappers in sync with the master spec:</p>
            <CodeBlock
              lang="bash"
              code={`# Verify wrappers match the spec
rosetta sync

# Force a clean regeneration
rosetta sync --regenerate-wrappers

# Watch for changes and re-render on save (300ms debounce)
rosetta watch`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="adding">
            <h2>Adding a new IDE</h2>
            <p>
              When you start using a new IDE, register it and Rosetta writes the wrapper from your existing spec:
            </p>
            <CodeBlock code="rosetta add-ide codex" lang="bash" />
            <p>Omit the name for an interactive selector.</p>
          </section>
        </FadeIn>
      </Prose>
    </>
  );
}
