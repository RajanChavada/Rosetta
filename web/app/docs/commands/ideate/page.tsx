import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { Callout } from '@/components/docs/callout';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function IdeateCommandsPage() {
  const cmds = commandsByGroup('ideate');
  const meta = COMMAND_GROUPS.ideate;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            <InlineCode>rosetta ideate</InlineCode> is the interactive entry point for designing skills. It
            inspects your project, builds a context-rich framing prompt, and (by default) copies it to your
            clipboard so you can paste it into an IDE agent. The agent asks clarifying questions and proposes
            skills tailored to your codebase.
          </p>
        </FadeIn>
        <FadeIn delay={0.05}>
          <Callout kind="tip" title="Use during scaffold">
            Running <InlineCode>rosetta scaffold --auto-ideate</InlineCode> runs ideation automatically right after
            the initial setup.
          </Callout>
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
