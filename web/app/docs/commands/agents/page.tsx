import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function AgentsCommandsPage() {
  const cmds = commandsByGroup('agents');
  const meta = COMMAND_GROUPS.agents;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            Agents are specialized sub-personas (architect, debugger, reviewer). Personas inject preset
            conventions into your spec. Workflows chain multiple agent steps. All three get merged into{' '}
            <code>rosetta.yaml</code> and synced across every IDE.
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
