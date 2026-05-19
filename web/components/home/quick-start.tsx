import { FadeIn } from '@/components/motion/fade-in';
import { CodeBlock } from '@/components/code/code-block';

const steps = [
  {
    n: 1,
    title: 'Install',
    body: 'Get the CLI globally, or use npx for a single-shot run.',
    command: 'npm install -g rosettablueprint',
  },
  {
    n: 2,
    title: 'Scaffold',
    body: 'Detects your stack, writes the .ai/ brain, and generates configs for every IDE you have installed.',
    command: 'rosetta scaffold --auto-ideate',
  },
  {
    n: 3,
    title: 'Use',
    body: 'Invoke skills inside your IDE. Slash-command in Claude Code, at-mention in Cursor and Windsurf.',
    command: '/your-skill   # or @your-skill',
  },
];

export function QuickStart() {
  return (
    <section className="py-24 px-6 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mb-3">
            Quick start
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-fg)] leading-tight">
            From zero to synced in under a minute.
          </h2>
        </FadeIn>
        <div className="mt-12 space-y-12">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.08}>
              <div className="grid md:grid-cols-[60px_1fr_auto] gap-6 items-start">
                <div className="font-mono text-2xl text-[var(--color-fg-faint)]">0{s.n}</div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-fg)]">{s.title}</h3>
                  <p className="mt-1 text-[var(--color-fg-muted)] text-sm leading-relaxed max-w-md">
                    {s.body}
                  </p>
                </div>
                <div className="md:min-w-[360px] w-full">
                  <CodeBlock code={s.command} lang="bash" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
