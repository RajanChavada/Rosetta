import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function TranslationCommandsPage() {
  const cmds = commandsByGroup('translation');
  const meta = COMMAND_GROUPS.translation;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            Translation commands convert config files between IDE formats one at a time, in bulk, or by adding a
            new IDE to your existing setup.
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
