import { ArrowRight } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/code/code-block';
import { DemoVideo } from './demo-video';

export function Hero() {
  return (
    <section className="relative px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
      <div className="mx-auto max-w-5xl text-center">
        <FadeIn delay={0}>
          <Badge className="mb-6">v0.5.6 · open source</Badge>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-fg)] leading-[1.08] sm:text-5xl md:text-6xl md:leading-[1.05]">
            One source of truth for AI agents
            <span className="block text-[var(--color-fg-muted)]">across every IDE.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mt-5 text-base text-[var(--color-fg-muted)] max-w-2xl mx-auto leading-relaxed sm:mt-6 sm:text-lg">
            Rosetta keeps Claude Code, Cursor, Windsurf, and 7 more IDEs in lockstep.
            Write your agent spec once, sync everywhere.
          </p>
        </FadeIn>
        <FadeIn delay={0.25}>
          <div className="mt-8 max-w-xl mx-auto text-left sm:mt-10">
            <CodeBlock code="npx rosettablueprint scaffold --auto-ideate" lang="bash" />
          </div>
        </FadeIn>
        <FadeIn delay={0.35}>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button href="/docs/getting-started">
              Get started <ArrowRight size={14} />
            </Button>
            <Button variant="secondary" href="/docs/commands">
              Browse commands
            </Button>
          </div>
        </FadeIn>
      </div>
      <div className="mt-10 sm:mt-16">
        <DemoVideo />
      </div>
    </section>
  );
}
