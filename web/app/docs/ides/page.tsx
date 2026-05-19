import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { IdeMatrix } from '@/components/docs/ide-matrix';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';
import { IDES } from '@/lib/content/ides';

export default function IdesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="IDE support"
        description="Ten IDEs supported today. Each has its own config path, skills directory, and invocation pattern."
      />
      <Prose>
        <FadeIn>
          <h2 id="matrix">Support matrix</h2>
          <p>
            Rosetta generates a wrapper for each IDE you opt into. Never edit a wrapper directly — re-run{' '}
            <InlineCode>rosetta sync</InlineCode> or <InlineCode>rosetta watch</InlineCode> to apply changes from
            the master spec.
          </p>
        </FadeIn>
      </Prose>
      <IdeMatrix ides={IDES} />

      <Prose>
        <FadeIn delay={0.05}>
          <h2 id="adding">Adding an IDE</h2>
          <p>Register a new IDE and Rosetta will write the wrapper from your existing spec:</p>
          <CodeBlock code="rosetta add-ide codex" lang="bash" />
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 id="translating">Translating between IDEs</h2>
          <p>Convert a single file:</p>
          <CodeBlock
            code="rosetta translate .cursorrules --to claude --output CLAUDE.md"
            lang="bash"
          />
          <p>Bulk migrate every IDE config to a target format:</p>
          <CodeBlock code="rosetta translate-all --to cursor --dry-run" lang="bash" />
        </FadeIn>
      </Prose>
    </>
  );
}
