import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { CodeBlock } from '@/components/code/code-block';
import { Callout } from '@/components/docs/callout';
import { IdeMatrix } from '@/components/docs/ide-matrix';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';
import { IDES } from '@/lib/content/ides';

export default function SkillsConceptPage() {
  const ideSubset = IDES.filter((i) =>
    ['claude', 'cursor', 'windsurf', 'codex'].includes(i.id),
  );

  return (
    <>
      <PageHeader
        eyebrow="Concepts"
        title="Skills"
        description="Portable agent capabilities that translate into every IDE you have configured."
      />
      <Prose>
        <FadeIn>
          <section id="what">
            <h2>What is a skill?</h2>
            <p>
              A skill is a single Markdown file with frontmatter describing when it applies and what the agent
              should do. Rosetta reads the canonical SKILL.md and translates it into each IDE&apos;s native format
              and invocation syntax.
            </p>
            <CodeBlock
              lang="markdown"
              title="SKILL.md"
              code={`---
name: api-auth
description: Streamlines auth and authorization workflows.
domains:
  - backend
  - security
---

# API Authentication Skill

## When to use
When implementing or modifying authentication flows.

## Instructions
1. Hash passwords with argon2id; never store plain text.
2. Issue tokens with explicit expirations.
3. Validate on every protected route, not in middleware order.`}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="translation">
            <h2>Multi-IDE translation</h2>
            <p>
              When you run <InlineCode>rosetta install</InlineCode>, the canonical SKILL.md is converted into each
              configured IDE&apos;s native format. The frontmatter, invocation pattern, and file path differ per IDE,
              but the rules in the body are identical.
            </p>
            <IdeMatrix ides={ideSubset} />
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="invoking">
            <h2>Invoking skills</h2>
            <p>Invocation syntax depends on the IDE:</p>
            <CodeBlock
              lang="plaintext"
              code={`Claude Code   /api-auth
Cursor        @api-auth
Windsurf      @api-auth`}
            />
            <Callout kind="note" title="Auto-loading">
              Some IDEs (Codex, Copilot) auto-detect skill applicability based on file globs in the frontmatter.
              Others rely on explicit invocation. Rosetta translates the frontmatter into whichever convention each
              IDE supports.
            </Callout>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="managing">
            <h2>Managing your skill library</h2>
            <CodeBlock
              lang="bash"
              code={`rosetta catalog               # browse available skills
rosetta search "react"        # search the catalog
rosetta install <url>         # install from a Git URL
rosetta skills                # list installed skills
rosetta uninstall <name>      # remove a skill`}
            />
          </section>
        </FadeIn>
      </Prose>
    </>
  );
}
