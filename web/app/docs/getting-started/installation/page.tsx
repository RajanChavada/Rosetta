import { PageHeader } from '@/components/docs/page-header';
import { Prose } from '@/components/docs/prose';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/code/code-block';
import { Tabs } from '@/components/ui/tabs';
import { FadeIn } from '@/components/motion/fade-in';
import { InlineCode } from '@/components/code/inline-code';

export default function InstallationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Installation"
        description="Three ways to install Rosetta. Pick whichever fits your workflow."
      />
      <Prose>
        <FadeIn>
          <section id="requirements">
            <h2>System requirements</h2>
            <ul>
              <li>Node.js 20 or newer</li>
              <li>git available on the PATH</li>
              <li>macOS, Linux, or Windows (WSL recommended on Windows)</li>
            </ul>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section id="install">
            <h2>Install</h2>
            <Tabs
              tabs={[
                {
                  id: 'npm',
                  label: 'npm',
                  content: (
                    <>
                      <p className="mt-4">Install globally so the <InlineCode>rosetta</InlineCode> binary is on your PATH:</p>
                      <CodeBlock code="npm install -g rosettablueprint" lang="bash" />
                      <p>Verify:</p>
                      <CodeBlock code="rosetta --version" lang="bash" />
                    </>
                  ),
                },
                {
                  id: 'npx',
                  label: 'npx (no install)',
                  content: (
                    <>
                      <p className="mt-4">Run Rosetta without installing globally. Best for one-off scaffolds:</p>
                      <CodeBlock code="npx rosettablueprint scaffold --auto-ideate" lang="bash" />
                    </>
                  ),
                },
                {
                  id: 'local',
                  label: 'Local dev',
                  content: (
                    <>
                      <p className="mt-4">Clone the source if you want to hack on Rosetta itself:</p>
                      <CodeBlock
                        code={`git clone https://github.com/RajanChavada/Rosetta.git
cd Rosetta
npm install
node ./cli.js scaffold`}
                        lang="bash"
                      />
                    </>
                  ),
                },
              ]}
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.1}>
          <section id="verify">
            <h2>Verify your install</h2>
            <p>
              After installing, drop into a project and run a health check. Rosetta will report a score and the
              files it expects to see:
            </p>
            <CodeBlock
              code={`$ rosetta health

Validating Rosetta structure...
┣━ .ai/master-skill.md OK
┣━ .ai/AGENT.md OK
┣━ .ai/task.md OK
┣━ .ai/memory/PROJECT_MEMORY.md OK
┣━ .ai/memory/AUTO_MEMORY.md OK
┗━ .ai/logs/daily/ OK

Rosetta Score: 100/100`}
              lang="bash"
              title="rosetta health"
            />
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section id="troubleshooting">
            <h2>Troubleshooting</h2>
            <Callout kind="note" title="Permission errors on global install">
              If <InlineCode>npm install -g</InlineCode> fails with EACCES, configure npm to use a user-owned
              global prefix instead of running with sudo. See the npm docs on
              {' '}
              <a href="https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally" target="_blank" rel="noreferrer">resolving EACCES permissions errors</a>.
            </Callout>
            <Callout kind="note" title="Command not found">
              If the shell can&apos;t find <InlineCode>rosetta</InlineCode>, your npm global bin directory probably
              isn&apos;t on your PATH. Run <InlineCode>npm config get prefix</InlineCode> and add{' '}
              <InlineCode>$prefix/bin</InlineCode> to PATH.
            </Callout>
          </section>
        </FadeIn>
      </Prose>
    </>
  );
}
