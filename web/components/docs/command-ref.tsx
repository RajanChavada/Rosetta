import { CodeBlock } from '@/components/code/code-block';
import { OptionTable } from './option-table';
import type { CommandSpec } from '@/lib/content/commands';

export async function CommandRef({ spec }: { spec: CommandSpec }) {
  return (
    <section id={spec.id} className="scroll-mt-24 mt-14 first:mt-0">
      <h2 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
        <code className="break-words font-mono text-[var(--color-fg)]">
          rosetta {spec.name}
        </code>
      </h2>
      <p className="text-[var(--color-fg-muted)] mb-4 max-w-prose leading-relaxed">
        {spec.summary}
      </p>
      {spec.examples.map((ex, i) => (
        <CodeBlock key={i} code={ex.command} lang="bash" title={ex.label} />
      ))}
      {spec.options.length > 0 && (
        <>
          <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mt-6 mb-2">
            Options
          </h3>
          <OptionTable options={spec.options} />
        </>
      )}
    </section>
  );
}
