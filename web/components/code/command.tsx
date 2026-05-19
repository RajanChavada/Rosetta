import { CodeBlock } from './code-block';
import { Badge } from '@/components/ui/badge';

type Props = {
  command: string;
  description?: string;
  badge?: string;
  title?: string;
};

export function Command({ command, description, badge, title }: Props) {
  return (
    <div className="my-8">
      {badge && (
        <div className="mb-3">
          <Badge>{badge}</Badge>
        </div>
      )}
      {description && (
        <p className="text-[var(--color-fg-muted)] mb-3 text-sm leading-relaxed">
          {description}
        </p>
      )}
      <CodeBlock code={command} lang="bash" title={title} />
    </div>
  );
}
