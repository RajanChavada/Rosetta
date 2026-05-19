import type { BundledLanguage } from 'shiki';
import { highlight } from '@/lib/highlight';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/cn';

type SupportedLang = BundledLanguage | 'plaintext';

type Props = {
  code: string;
  lang?: SupportedLang;
  title?: string;
  className?: string;
  noCopy?: boolean;
};

export async function CodeBlock({
  code,
  lang = 'bash',
  title,
  className,
  noCopy = false,
}: Props) {
  const trimmed = code.trim();
  const html = await highlight(trimmed, lang);

  return (
    <figure
      className={cn(
        'group relative my-6 overflow-hidden rounded-lg',
        'border border-[var(--color-border)] bg-[var(--color-bg-elev)]',
        className,
      )}
    >
      {title && (
        <figcaption className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-inline)] px-4 py-2">
          <span className="font-mono text-xs text-[var(--color-fg-faint)]">{title}</span>
          {!noCopy && <CopyButton text={trimmed} />}
        </figcaption>
      )}

      <div className="relative">
        {!title && !noCopy && (
          <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <CopyButton text={trimmed} />
          </div>
        )}

        <div
          className="overflow-x-auto px-4 py-4 text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </figure>
  );
}
