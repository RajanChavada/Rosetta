import Link from 'next/link';
import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import {
  COMMAND_GROUPS,
  COMMANDS,
  commandsByGroup,
  type CommandGroup,
} from '@/lib/content/commands';

export default function CommandsIndexPage() {
  const groups = Object.keys(COMMAND_GROUPS) as CommandGroup[];

  return (
    <>
      <PageHeader
        eyebrow="Commands"
        title="All commands"
        description={`Every Rosetta command, grouped by purpose. ${COMMANDS.length} total.`}
      />
      <Prose>
        {groups.map((g, i) => {
          const meta = COMMAND_GROUPS[g];
          const cmds = commandsByGroup(g);
          return (
            <FadeIn key={g} delay={i * 0.04}>
              <section id={g} className="scroll-mt-24 mt-10 first:mt-0">
                <h2>
                  <Link href={meta.route} className="!text-[var(--color-fg)] hover:!text-[var(--color-accent)]">
                    {meta.title}
                  </Link>
                </h2>
                <p>{meta.description}</p>
                <ul>
                  {cmds.map((c) => (
                    <li key={c.id}>
                      <Link href={`${meta.route}#${c.id}`} className="font-mono">
                        rosetta {c.name}
                      </Link>
                      <span className="text-[var(--color-fg-faint)]"> — {c.summary}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          );
        })}
      </Prose>
    </>
  );
}
