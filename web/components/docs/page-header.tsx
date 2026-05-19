export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-10 border-b border-[var(--color-border)] pb-8">
      {eyebrow && (
        <p className="text-xs font-mono text-[var(--color-fg-faint)] mb-2 uppercase tracking-wider">
          {eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-semibold text-[var(--color-fg)] tracking-tight leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-lg text-[var(--color-fg-muted)] max-w-prose leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}
