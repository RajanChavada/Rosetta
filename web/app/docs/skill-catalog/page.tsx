import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { FEATURED_SKILLS } from '@/lib/content/skills';

export default function SkillCatalogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="Skill catalog"
        description="Reusable agent skills. Install once, available in every configured IDE."
      />
      <Prose>
        <FadeIn>
          <h2 id="quick-reference">Quick reference</h2>
          <CodeBlock
            lang="bash"
            code={`rosetta catalog               # browse all skills
rosetta search "react"        # full-text search
rosetta install <url>         # install from Git URL
rosetta new-skill my-skill    # scaffold a new skill
rosetta skills                # list installed skills
rosetta uninstall my-skill    # remove a skill`}
          />
        </FadeIn>
      </Prose>

      <h2
        id="featured"
        className="text-2xl font-semibold text-[var(--color-fg)] tracking-tight mt-12 mb-6 scroll-mt-24"
      >
        Featured skills
      </h2>
      <Stagger className="grid md:grid-cols-2 gap-4">
        {FEATURED_SKILLS.map((s) => (
          <StaggerItem key={s.name}>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 h-full">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-[var(--color-fg)] font-medium">{s.displayName}</h3>
                <span className="font-mono text-xs text-[var(--color-fg-faint)] whitespace-nowrap">
                  {s.name}
                </span>
              </div>
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                {s.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.domains.map((d) => (
                  <Badge key={d}>{d}</Badge>
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </>
  );
}
