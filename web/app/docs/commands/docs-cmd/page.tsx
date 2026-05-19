import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function DocsCommandsPage() {
  const cmds = commandsByGroup('docs');
  const meta = COMMAND_GROUPS.docs;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            Generate documentation from your project. <code>rosetta doc</code> writes a CLAUDE.md draft inferred
            from your codebase; <code>rosetta docs</code> generates an interactive HTML browser for every installed
            skill.
          </p>
        </FadeIn>
      </Prose>
      {cmds.map((c, i) => (
        <FadeIn key={c.id} delay={i * 0.04}>
          <CommandRef spec={c} />
        </FadeIn>
      ))}
    </>
  );
}
